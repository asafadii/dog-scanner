import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import { mapBookingRowToBooking } from "@/lib/bookings";
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
import type { CreatePortalBookingSuccessResponse } from "@/lib/portal/bookings";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { BookingFormData, BookingServiceType } from "@/lib/types";
import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

interface CreatePortalBookingBody extends BookingFormData {
  facilityId?: string;
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
  db: Parameters<typeof countApprovedBookingsOnDate>[0],
  facilityId: string,
  serviceType: BookingServiceType,
  startDate: string,
  endDate: string,
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
    if (used + 1 > capacityLimit) {
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

  let body: CreatePortalBookingBody;
  try {
    body = (await request.json()) as CreatePortalBookingBody;
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
  const startDate = body.startDate?.trim();
  const endDate = body.endDate?.trim();

  if (!clientId || !facilityId || !dogId || !serviceType || !startDate || !endDate) {
    return NextResponse.json(
      { ok: false, error: "Missing required booking fields" },
      { status: 400 },
    );
  }

  if (endDate < startDate) {
    return NextResponse.json(
      { ok: false, error: "End date must be on or after start date" },
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

  const { data: priorStay } = await db
    .from("bookings")
    .select("id")
    .eq("facility_id", facilityId)
    .eq("dog_id", dogId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  const isReturningDog = priorStay !== null;

  const autoApprove =
    isReturningDog &&
    (await canAutoApprovePortalBooking(
      db,
      facilityId,
      serviceType,
      startDate,
      endDate,
    ));

  const { data, error } = await db
    .from("bookings")
    .insert({
      facility_id: facilityId,
      client_id: clientId,
      dog_id: dogId,
      service_type: serviceType,
      start_date: startDate,
      end_date: endDate,
      transport_required: Boolean(body.transportRequired),
      status: autoApprove ? "approved" : "pending",
      notes: body.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Failed to create booking" },
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

  const response: CreatePortalBookingSuccessResponse = {
    ok: true,
    booking: mapBookingRowToBooking(
      data,
      clientRow?.name ?? "Unknown client",
      dogRow?.name ?? "Unknown dog",
      dogRow?.breed ?? "",
    ),
  };

  const { data: facilityRow } = await db
    .from("facilities")
    .select("name")
    .eq("id", facilityId)
    .maybeSingle();
  const facilityName = facilityRow?.name ?? "your daycare";
  const startDateFormatted = formatEmailDate(response.booking.startDate);
  const endDateFormatted = formatEmailDate(response.booking.endDate);
  const clientNameForEmail = clientRow?.name ?? "A client";

  if (clientRow?.email?.trim()) {
    const portalUrl = `${APP_URL}/portal/bookings/${response.booking.id}`;

    if (autoApprove) {
      await sendTransactionalEmail({
        to: clientRow.email,
        subject: `🎉🐾 ${response.booking.dogName}'s booking is officially confirmed!`,
        html: buildBookingApprovedHtml({
          clientName: clientRow.name,
          dogName: response.booking.dogName,
          facilityName,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          portalUrl,
        }),
      });
    } else {
      await sendTransactionalEmail({
        to: clientRow.email,
        subject: `Booking received for ${response.booking.dogName} 🐾`,
        html: buildBookingConfirmationHtml({
          clientName: clientRow.name,
          dogName: response.booking.dogName,
          facilityName,
          serviceType: response.booking.serviceType,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          portalUrl,
        }),
      });
    }
  }

  const adminEmails = await getFacilityNotificationRecipients(db, facilityId);
  if (adminEmails.length > 0) {
    const bookingUrl = `${APP_URL}/bookings/${response.booking.id}`;
    const html = autoApprove
      ? buildFacilityAutoApprovedBookingHtml({
          dogName: response.booking.dogName,
          clientName: clientNameForEmail,
          serviceType: response.booking.serviceType,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          bookingUrl,
        })
      : buildFacilityNewBookingRequestHtml({
          dogName: response.booking.dogName,
          clientName: clientNameForEmail,
          serviceType: response.booking.serviceType,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          bookingUrl,
        });

    for (const email of adminEmails) {
      await sendTransactionalEmail({
        to: email,
        subject: autoApprove
          ? `Booking auto-confirmed for ${response.booking.dogName}`
          : `New booking request for ${response.booking.dogName}`,
        html,
      });
    }
  }

  return NextResponse.json(response, { status: 201 });
}
