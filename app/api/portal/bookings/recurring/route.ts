import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import {
  mapBookingRowToBooking,
  normalizeBookingTime,
  parseFoodSource,
  validateRecurringBookingInput,
} from "@/lib/bookings";
import { getFacilityNotificationRecipients } from "@/lib/bookings/server";
import {
  DEFAULT_BOARDING_CAPACITY,
  DEFAULT_DAYCARE_CAPACITY,
  enumerateDates,
} from "@/lib/capacity";
import {
  buildBookingApprovedHtml,
  buildBookingConfirmationHtml,
  buildFacilityAutoApprovedBookingHtml,
  buildFacilityNewBookingRequestHtml,
  formatEmailDate,
} from "@/lib/email";
import type { CreatePortalBookingsSuccessResponse } from "@/lib/portal/bookings";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import { enumerateRecurringOccurrences } from "@/lib/recurrence";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  BookingServiceType,
  RecurrenceFrequency,
  RecurringBookingInput,
} from "@/lib/types";
import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

interface RecurringBookingBody {
  clientId?: string;
  facilityId?: string;
  dogId?: string;
  serviceType?: BookingServiceType;
  recurrenceFreq?: RecurrenceFrequency;
  recurrenceDaysOfWeek?: number[];
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;
  endDate?: string;
  arrivalTime?: string;
  endTime?: string;
  transportRequired?: boolean;
  foodSource?: string | null;
  notes?: string;
}

type AdminDb = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

async function countApprovedBookingsOnDate(
  db: AdminDb,
  facilityId: string,
  date: string,
  serviceType: BookingServiceType,
): Promise<number> {
  const { data, error } = await db
    .from("bookings")
    .select("id")
    .eq("facility_id", facilityId)
    .eq("status", "approved")
    .eq("service_type", serviceType)
    .lte("start_date", date)
    .gte("end_date", date);

  if (error || !data) return 0;
  return data.length;
}

async function canAutoApprovePortalBooking(
  db: AdminDb,
  facilityId: string,
  serviceType: BookingServiceType,
  startDate: string,
  endDate: string,
  projectedApprovedByDate: Map<string, number> = new Map(),
): Promise<boolean> {
  const { data: capacityRow } = await db
    .from("facility_capacity")
    .select("daycare_capacity, boarding_capacity")
    .eq("facility_id", facilityId)
    .maybeSingle();

  const capacityLimit =
    serviceType === "daycare"
      ? (capacityRow?.daycare_capacity ?? DEFAULT_DAYCARE_CAPACITY)
      : (capacityRow?.boarding_capacity ?? DEFAULT_BOARDING_CAPACITY);

  for (const date of enumerateDates(startDate, endDate)) {
    const used = await countApprovedBookingsOnDate(
      db,
      facilityId,
      date,
      serviceType,
    );
    const projected = projectedApprovedByDate.get(date) ?? 0;
    if (used + projected + 1 > capacityLimit) {
      return false;
    }
  }

  return true;
}

export async function POST(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;

  let body: RecurringBookingBody;
  try {
    body = (await request.json()) as RecurringBookingBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const clientId = body.clientId?.trim();
  const facilityId = body.facilityId?.trim();
  const dogId = body.dogId?.trim();
  const serviceType = body.serviceType as BookingServiceType | undefined;
  const recurrenceStartDate = body.recurrenceStartDate?.trim();
  const recurrenceEndDate = body.recurrenceEndDate?.trim();

  if (!clientId || !facilityId || !dogId || !serviceType || !recurrenceStartDate) {
    return NextResponse.json(
      { ok: false, error: "Missing required booking fields" },
      { status: 400 },
    );
  }

  const firstEndDate =
    serviceType === "daycare"
      ? recurrenceStartDate
      : (body.endDate?.trim() ?? "");

  const recurringInput: RecurringBookingInput = {
    clientId,
    dogId,
    serviceType,
    recurrenceFreq: body.recurrenceFreq as RecurrenceFrequency,
    recurrenceDaysOfWeek: Array.isArray(body.recurrenceDaysOfWeek)
      ? body.recurrenceDaysOfWeek
      : [],
    recurrenceStartDate,
    recurrenceEndDate: recurrenceEndDate ?? "",
    endDate: firstEndDate,
    arrivalTime: body.arrivalTime,
    endTime: body.endTime,
    transportRequired: Boolean(body.transportRequired),
    foodSource: parseFoodSource(body.foodSource),
    notes: body.notes ?? "",
  };

  const validationError = validateRecurringBookingInput(recurringInput);
  if (validationError) {
    return NextResponse.json(
      { ok: false, error: validationError.message },
      { status: 400 },
    );
  }

  const linked = await verifyClientAccountLink(db, user.id, clientId, facilityId);
  if (!linked) {
    return NextResponse.json(
      { ok: false, error: "Not authorized" },
      { status: 403 },
    );
  }

  const { data: dog, error: dogError } = await db
    .from("dogs")
    .select("id, client_id, facility_id")
    .eq("id", dogId)
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (dogError) {
    return NextResponse.json(
      { ok: false, error: dogError.message },
      { status: 500 },
    );
  }

  if (!dog) {
    return NextResponse.json(
      { ok: false, error: "Dog not found for this client" },
      { status: 403 },
    );
  }

  const occurrences = enumerateRecurringOccurrences({
    ...recurringInput,
    endDate: firstEndDate,
  });
  const arrivalTime = normalizeBookingTime(recurringInput.arrivalTime);
  const endTime = normalizeBookingTime(recurringInput.endTime);
  const notes = recurringInput.notes.trim() || null;
  const daysOfWeek = [...new Set(recurringInput.recurrenceDaysOfWeek)].sort(
    (a, b) => a - b,
  );

  const { data: seriesRow, error: seriesError } = await db
    .from("booking_series")
    .insert({
      facility_id: facilityId,
      client_id: clientId,
      dog_id: dogId,
      service_type: serviceType,
      recurrence_freq: recurringInput.recurrenceFreq,
      recurrence_days_of_week: daysOfWeek,
      recurrence_start_date: recurringInput.recurrenceStartDate,
      recurrence_end_date: recurringInput.recurrenceEndDate,
      arrival_time: arrivalTime,
      end_time: endTime,
      transport_required: recurringInput.transportRequired,
      food_source: recurringInput.foodSource ?? null,
      notes,
      status: "active" as const,
    })
    .select("*")
    .single();

  if (seriesError || !seriesRow) {
    return NextResponse.json(
      {
        ok: false,
        error: seriesError?.message ?? "Failed to create booking series",
      },
      { status: 500 },
    );
  }

  const { data: priorStay } = await db
    .from("bookings")
    .select("id")
    .eq("facility_id", facilityId)
    .eq("dog_id", dogId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  const isReturningDog = priorStay !== null;
  const projectedApprovedByDate = new Map<string, number>();

  const insertRows = [];
  for (const occurrence of occurrences) {
    const autoApprove =
      isReturningDog &&
      (await canAutoApprovePortalBooking(
        db,
        facilityId,
        serviceType,
        occurrence.startDate,
        occurrence.endDate,
        projectedApprovedByDate,
      ));

    if (autoApprove) {
      for (const date of enumerateDates(occurrence.startDate, occurrence.endDate)) {
        projectedApprovedByDate.set(
          date,
          (projectedApprovedByDate.get(date) ?? 0) + 1,
        );
      }
    }

    insertRows.push({
      facility_id: facilityId,
      client_id: clientId,
      dog_id: dogId,
      service_type: serviceType,
      start_date: occurrence.startDate,
      end_date: occurrence.endDate,
      arrival_time: arrivalTime,
      end_time: endTime,
      transport_required: recurringInput.transportRequired,
      food_source: recurringInput.foodSource ?? null,
      status: autoApprove ? ("approved" as const) : ("pending" as const),
      notes,
      series_id: seriesRow.id,
      series_occurrence_date: occurrence.startDate,
    });
  }

  const { data, error } = await db
    .from("bookings")
    .insert(insertRows)
    .select("*");

  if (error || !data || data.length === 0) {
    await db.from("booking_series").delete().eq("id", seriesRow.id);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Failed to create bookings" },
      { status: 500 },
    );
  }

  const { data: clientRow } = await db
    .from("clients")
    .select("name, email")
    .eq("id", clientId)
    .maybeSingle();

  const { data: dogRow } = await db
    .from("dogs")
    .select("name, breed")
    .eq("id", dogId)
    .maybeSingle();

  const bookings = data.map((row) =>
    mapBookingRowToBooking(
      row,
      clientRow?.name ?? "Unknown client",
      dogRow?.name ?? "Unknown dog",
      dogRow?.breed ?? "",
    ),
  );

  const response: CreatePortalBookingsSuccessResponse = {
    ok: true,
    bookings,
  };

  const { data: facilityRow } = await db
    .from("facilities")
    .select("name")
    .eq("id", facilityId)
    .maybeSingle();
  const facilityName = facilityRow?.name ?? "your daycare";
  const clientNameForEmail = clientRow?.name ?? "A client";
  const adminEmails = await getFacilityNotificationRecipients(db, facilityId);

  for (const booking of bookings) {
    const startDateFormatted = formatEmailDate(booking.startDate);
    const endDateFormatted = formatEmailDate(booking.endDate);
    const autoApprove = booking.status === "approved";

    if (clientRow?.email?.trim()) {
      const portalUrl = `${APP_URL}/portal/bookings/${booking.id}`;

      if (autoApprove) {
        await sendTransactionalEmail({
          to: clientRow.email,
          subject: `🎉🐾 ${booking.dogName}'s booking is officially confirmed!`,
          html: buildBookingApprovedHtml({
            clientName: clientRow.name,
            dogName: booking.dogName,
            facilityName,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            portalUrl,
          }),
        });
      } else {
        await sendTransactionalEmail({
          to: clientRow.email,
          subject: `Booking received for ${booking.dogName} 🐾`,
          html: buildBookingConfirmationHtml({
            clientName: clientRow.name,
            dogName: booking.dogName,
            facilityName,
            serviceType: booking.serviceType,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            portalUrl,
          }),
        });
      }
    }

    if (adminEmails.length > 0) {
      const bookingUrl = `${APP_URL}/bookings/${booking.id}`;
      const html = autoApprove
        ? buildFacilityAutoApprovedBookingHtml({
            dogName: booking.dogName,
            clientName: clientNameForEmail,
            serviceType: booking.serviceType,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            bookingUrl,
          })
        : buildFacilityNewBookingRequestHtml({
            dogName: booking.dogName,
            clientName: clientNameForEmail,
            serviceType: booking.serviceType,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            bookingUrl,
          });

      for (const email of adminEmails) {
        await sendTransactionalEmail({
          to: email,
          subject: autoApprove
            ? `Booking auto-confirmed for ${booking.dogName}`
            : `New booking request for ${booking.dogName}`,
          html,
        });
      }
    }
  }

  return NextResponse.json(response, { status: 201 });
}
