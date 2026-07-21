import "server-only";

import { mapBookingRowToBooking } from "@/lib/bookings";
import {
  DEFAULT_BOARDING_CAPACITY,
  DEFAULT_DAYCARE_CAPACITY,
  enumerateDates,
} from "@/lib/capacity";
import type { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  BookingInsert,
  BookingRow,
  BookingUpdate,
  ClientRow,
  DogRow,
} from "@/lib/supabase/types";
import type { Booking, BookingFormData, BookingStatus } from "@/lib/types";

type ServerDb = NonNullable<
  ReturnType<
    typeof import("@/lib/supabase/server").createSupabaseAdminClient
  >
>;

type ServerResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

function toBookingInsert(
  facilityId: string,
  input: BookingFormData,
  options?: { pendingAccountLink?: boolean },
): BookingInsert {
  return {
    facility_id: facilityId,
    client_id: input.clientId,
    dog_id: input.dogId,
    service_type: input.serviceType,
    start_date: input.startDate,
    end_date: input.endDate,
    transport_required: input.transportRequired,
    status: "pending",
    notes: input.notes.trim() || null,
    pending_account_link: options?.pendingAccountLink ?? false,
  };
}

async function enrichBooking(
  db: ServerDb,
  row: BookingRow,
): Promise<Booking> {
  const [clientResult, dogResult] = await Promise.all([
    db
      .from("clients")
      .select("name")
      .eq("id", row.client_id)
      .eq("facility_id", row.facility_id)
      .maybeSingle(),
    db
      .from("dogs")
      .select("name, breed, photo_url")
      .eq("id", row.dog_id)
      .eq("facility_id", row.facility_id)
      .maybeSingle(),
  ]);

  const client = clientResult.data as Pick<ClientRow, "name"> | null;
  const dog = dogResult.data as Pick<
    DogRow,
    "name" | "breed" | "photo_url"
  > | null;

  return mapBookingRowToBooking(
    row,
    client?.name ?? "Unknown client",
    dog?.name ?? "Unknown dog",
    dog?.breed ?? "",
    dog?.photo_url ?? null,
  );
}

async function countApprovedBookingsOnDate(
  db: ServerDb,
  facilityId: string,
  date: string,
  serviceType: "daycare" | "boarding",
  excludeBookingId?: string,
): Promise<number> {
  const { data, error } = await db
    .from("bookings")
    .select("id")
    .eq("facility_id", facilityId)
    .eq("status", "approved")
    .eq("service_type", serviceType)
    .lte("start_date", date)
    .gte("end_date", date);

  if (error || !data) {
    return 0;
  }

  const rows = data as Pick<BookingRow, "id">[];
  if (!excludeBookingId) {
    return rows.length;
  }

  return rows.filter((row) => row.id !== excludeBookingId).length;
}

async function getFacilityCapacityLimits(
  db: ServerDb,
  facilityId: string,
): Promise<{ daycareCapacity: number; boardingCapacity: number }> {
  const { data } = await db
    .from("facility_capacity")
    .select("daycare_capacity, boarding_capacity")
    .eq("facility_id", facilityId)
    .maybeSingle();

  return {
    daycareCapacity: data?.daycare_capacity ?? DEFAULT_DAYCARE_CAPACITY,
    boardingCapacity: data?.boarding_capacity ?? DEFAULT_BOARDING_CAPACITY,
  };
}

async function canApproveBookingServer(
  db: ServerDb,
  facilityId: string,
  booking: BookingRow,
): Promise<{ canApprove: boolean; message: string | null }> {
  const limits = await getFacilityCapacityLimits(db, facilityId);
  const capacityLimit =
    booking.service_type === "daycare"
      ? limits.daycareCapacity
      : limits.boardingCapacity;
  const label = booking.service_type === "daycare" ? "Daycare" : "Boarding";

  for (const date of enumerateDates(booking.start_date, booking.end_date)) {
    const used = await countApprovedBookingsOnDate(
      db,
      facilityId,
      date,
      booking.service_type,
      booking.id,
    );

    if (used + 1 > capacityLimit) {
      return {
        canApprove: false,
        message: `${label} is full on ${date} (${used}/${capacityLimit} spots). This booking cannot be approved until capacity opens up.`,
      };
    }
  }

  return { canApprove: true, message: null };
}

export function parseBookingFormData(body: unknown): BookingFormData | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const clientId =
    typeof record.clientId === "string" ? record.clientId.trim() : "";
  const dogId = typeof record.dogId === "string" ? record.dogId.trim() : "";
  const serviceType = record.serviceType;
  const startDate =
    typeof record.startDate === "string" ? record.startDate.trim() : "";
  const endDate =
    typeof record.endDate === "string" ? record.endDate.trim() : "";
  const notes = typeof record.notes === "string" ? record.notes : "";

  if (
    !clientId ||
    !dogId ||
    (serviceType !== "daycare" && serviceType !== "boarding") ||
    !startDate ||
    !endDate
  ) {
    return null;
  }

  return {
    clientId,
    dogId,
    serviceType,
    startDate,
    endDate,
    transportRequired: Boolean(record.transportRequired),
    notes,
  };
}

export async function createBookingServer(
  db: ServerDb,
  facilityId: string,
  input: BookingFormData,
  options?: { pendingAccountLink?: boolean },
): Promise<ServerResult<Booking>> {
  const [clientCheck, dogCheck] = await Promise.all([
    db
      .from("clients")
      .select("id")
      .eq("id", input.clientId)
      .eq("facility_id", facilityId)
      .maybeSingle(),
    db
      .from("dogs")
      .select("id")
      .eq("id", input.dogId)
      .eq("facility_id", facilityId)
      .maybeSingle(),
  ]);

  if (!clientCheck.data || !dogCheck.data) {
    return { data: null, error: "Client or dog not found in this facility" };
  }

  const { data, error } = await db
    .from("bookings")
    .insert(toBookingInsert(facilityId, input, options))
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: await enrichBooking(db, data as BookingRow),
    error: null,
  };
}

export async function updateBookingStatusServer(
  db: ServerDb,
  facilityId: string,
  bookingId: string,
  status: BookingStatus,
): Promise<ServerResult<Booking>> {
  const { data: existing, error: fetchError } = await db
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  if (!existing) {
    return { data: null, error: "Booking not found" };
  }

  const bookingRow = existing as BookingRow;

  if (status === "approved") {
    const approval = await canApproveBookingServer(db, facilityId, bookingRow);
    if (!approval.canApprove) {
      return {
        data: null,
        error:
          approval.message ??
          "This booking cannot be approved because capacity is full.",
      };
    }
  }

  const update: BookingUpdate = {
    status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("bookings")
    .update(update)
    .eq("id", bookingId)
    .eq("facility_id", facilityId)
    .select("*")
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: "Booking not found" };
  }

  return {
    data: await enrichBooking(db, data as BookingRow),
    error: null,
  };
}

export interface BookingEmailContext {
  clientEmail: string;
  clientName: string;
  dogName: string;
  facilityName: string;
  booking: Booking;
}

export async function getBookingEmailContext(
  db: ServerDb,
  facilityId: string,
  booking: Booking,
): Promise<BookingEmailContext | null> {
  const [clientResult, facilityResult] = await Promise.all([
    db
      .from("clients")
      .select("name, email")
      .eq("id", booking.clientId)
      .eq("facility_id", facilityId)
      .maybeSingle(),
    db
      .from("facilities")
      .select("name")
      .eq("id", facilityId)
      .maybeSingle(),
  ]);

  const client = clientResult.data as Pick<ClientRow, "name" | "email"> | null;
  if (!client?.email?.trim()) {
    return null;
  }

  return {
    clientEmail: client.email,
    clientName: client.name,
    dogName: booking.dogName,
    facilityName: facilityResult.data?.name ?? "your daycare",
    booking,
  };
}
