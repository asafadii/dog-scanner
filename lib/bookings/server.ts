import "server-only";

import {
  mapBookingRowToBooking,
  normalizeBookingTime,
  parseFoodSource,
  validateBookingFormData,
  validateBookingTimes,
} from "@/lib/bookings";
import {
  DEFAULT_BOARDING_CAPACITY,
  DEFAULT_DAYCARE_CAPACITY,
  enumerateDates,
} from "@/lib/capacity";
import {
  defaultNotificationPreferences,
  mapFacilityNotificationPreferencesRowToFacilityNotificationPreferences,
} from "@/lib/notifications";
import type { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  BookingInsert,
  BookingRow,
  BookingUpdate,
  ClientRow,
  DogRow,
  FacilityNotificationPreferencesRow,
} from "@/lib/supabase/types";
import type {
  Booking,
  BookingFormData,
  BookingSeriesCancelScope,
  BookingStatus,
  CancelBookingSeriesResult,
  EditBookingSeriesFields,
  EditBookingSeriesResult,
  FacilityNotificationPreferences,
} from "@/lib/types";
import { addCalendarDays } from "@/lib/recurrence";

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
    arrival_time: normalizeBookingTime(input.arrivalTime),
    end_time: normalizeBookingTime(input.endTime),
    transport_required: input.transportRequired,
    food_source: input.foodSource ?? null,
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
  const arrivalTime =
    typeof record.arrivalTime === "string" ? record.arrivalTime.trim() : "";
  const endTime =
    typeof record.endTime === "string" ? record.endTime.trim() : "";

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
    arrivalTime,
    endTime,
    transportRequired: Boolean(record.transportRequired),
    foodSource: parseFoodSource(record.foodSource),
    notes,
  };
}

export async function createBookingServer(
  db: ServerDb,
  facilityId: string,
  input: BookingFormData,
  options?: { pendingAccountLink?: boolean },
): Promise<ServerResult<Booking>> {
  const validationError = validateBookingFormData(input);
  if (validationError) {
    return { data: null, error: validationError.message };
  }

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
  options?: { cancelledBy?: "staff" | "client" },
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

  if (status === "cancelled") {
    if (bookingRow.status !== "pending" && bookingRow.status !== "approved") {
      return {
        data: null,
        error: "Only pending or approved bookings can be cancelled",
      };
    }
  }

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
    ...(status === "cancelled"
      ? { cancelled_by: options?.cancelledBy ?? "staff" }
      : {}),
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

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function occurrenceDateOf(row: {
  start_date: string;
  series_occurrence_date: string | null;
}): string {
  return row.series_occurrence_date ?? row.start_date;
}

type SeriesScopeRow = Pick<
  BookingRow,
  "id" | "start_date" | "series_occurrence_date" | "status"
>;

async function selectUnprotectedSeriesOccurrences(
  db: ServerDb,
  facilityId: string,
  origin: BookingRow,
  scope: "future" | "all",
): Promise<ServerResult<{ ids: string[]; skippedCount: number }>> {
  const originOccurrenceDate = occurrenceDateOf(origin);
  const today = todayDateString();

  const { data: seriesRows, error: seriesError } = await db
    .from("bookings")
    .select("id, start_date, series_occurrence_date, status")
    .eq("facility_id", facilityId)
    .eq("series_id", origin.series_id);

  if (seriesError) {
    return { data: null, error: seriesError.message };
  }

  const inScope = ((seriesRows ?? []) as SeriesScopeRow[]).filter((row) => {
    if (scope === "future") {
      return occurrenceDateOf(row) >= originOccurrenceDate;
    }
    return true;
  });

  const candidates = inScope.filter(
    (row) => row.status === "pending" || row.status === "approved",
  );

  const protectedIds = new Set<string>();
  const candidateIds = candidates.map((row) => row.id);

  if (candidateIds.length > 0) {
    const [checkinsResult, paymentsResult] = await Promise.all([
      db
        .from("dog_checkins")
        .select("booking_id")
        .eq("facility_id", facilityId)
        .in("booking_id", candidateIds),
      db
        .from("payments")
        .select("booking_id")
        .eq("facility_id", facilityId)
        .in("booking_id", candidateIds),
    ]);

    for (const row of (checkinsResult.data ?? []) as {
      booking_id: string | null;
    }[]) {
      if (row.booking_id) protectedIds.add(row.booking_id);
    }
    for (const row of (paymentsResult.data ?? []) as {
      booking_id: string | null;
    }[]) {
      if (row.booking_id) protectedIds.add(row.booking_id);
    }
  }

  const ids: string[] = [];
  let skippedCount = 0;

  for (const row of candidates) {
    if (row.start_date < today || protectedIds.has(row.id)) {
      skippedCount += 1;
      continue;
    }
    ids.push(row.id);
  }

  return { data: { ids, skippedCount }, error: null };
}

function toOccurrenceFieldUpdate(fields: EditBookingSeriesFields): BookingUpdate {
  const update: BookingUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (fields.arrivalTime !== undefined) {
    update.arrival_time = normalizeBookingTime(fields.arrivalTime);
  }
  if (fields.endTime !== undefined) {
    update.end_time = normalizeBookingTime(fields.endTime);
  }
  if (fields.transportRequired !== undefined) {
    update.transport_required = fields.transportRequired;
  }
  if (fields.notes !== undefined) {
    update.notes = fields.notes.trim() || null;
  }

  return update;
}

function hasOccurrenceFields(fields: EditBookingSeriesFields): boolean {
  return (
    fields.arrivalTime !== undefined ||
    fields.endTime !== undefined ||
    fields.transportRequired !== undefined ||
    fields.notes !== undefined
  );
}

function validateOccurrenceFieldTimes(
  origin: BookingRow,
  fields: EditBookingSeriesFields,
): string | null {
  if (fields.arrivalTime === undefined && fields.endTime === undefined) {
    return null;
  }

  const timeError = validateBookingTimes({
    startDate: origin.start_date,
    endDate: origin.end_date,
    arrivalTime:
      fields.arrivalTime !== undefined
        ? fields.arrivalTime
        : (origin.arrival_time ?? ""),
    endTime:
      fields.endTime !== undefined ? fields.endTime : (origin.end_time ?? ""),
  });

  return timeError?.message ?? null;
}

export function parseEditBookingSeriesFields(
  body: unknown,
): EditBookingSeriesFields | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const fields: EditBookingSeriesFields = {};

  if (typeof record.arrivalTime === "string") {
    fields.arrivalTime = record.arrivalTime;
  }
  if (typeof record.endTime === "string") {
    fields.endTime = record.endTime;
  }
  if (typeof record.transportRequired === "boolean") {
    fields.transportRequired = record.transportRequired;
  }
  if (typeof record.notes === "string") {
    fields.notes = record.notes;
  }

  return hasOccurrenceFields(fields) ? fields : null;
}

async function updateBookingOccurrenceFieldsServer(
  db: ServerDb,
  facilityId: string,
  bookingId: string,
  fields: EditBookingSeriesFields,
): Promise<ServerResult<true>> {
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

  const origin = existing as BookingRow;
  const timeError = validateOccurrenceFieldTimes(origin, fields);
  if (timeError) {
    return { data: null, error: timeError };
  }

  const { error: updateError } = await db
    .from("bookings")
    .update(toOccurrenceFieldUpdate(fields))
    .eq("id", bookingId)
    .eq("facility_id", facilityId);

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  return { data: true, error: null };
}

export async function cancelBookingSeriesServer(
  db: ServerDb,
  facilityId: string,
  bookingId: string,
  scope: BookingSeriesCancelScope,
  cancelledBy: "staff" | "client",
): Promise<ServerResult<CancelBookingSeriesResult>> {
  if (scope === "this") {
    const result = await updateBookingStatusServer(
      db,
      facilityId,
      bookingId,
      "cancelled",
      { cancelledBy },
    );
    if (result.error || !result.data) {
      return { data: null, error: result.error ?? "Failed to cancel booking" };
    }
    return { data: { cancelledCount: 1, skippedCount: 0 }, error: null };
  }

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

  const origin = existing as BookingRow;
  if (!origin.series_id) {
    return { data: null, error: "Booking is not part of a series" };
  }

  const selection = await selectUnprotectedSeriesOccurrences(
    db,
    facilityId,
    origin,
    scope,
  );
  if (selection.error || !selection.data) {
    return { data: null, error: selection.error ?? "Failed to load series" };
  }

  const { ids: toCancel, skippedCount } = selection.data;

  if (toCancel.length > 0) {
    const { error: updateError } = await db
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_by: cancelledBy,
        updated_at: new Date().toISOString(),
      })
      .eq("facility_id", facilityId)
      .in("id", toCancel);

    if (updateError) {
      return { data: null, error: updateError.message };
    }
  }

  const originOccurrenceDate = occurrenceDateOf(origin);

  const { data: series, error: seriesFetchError } = await db
    .from("booking_series")
    .select("id, recurrence_start_date")
    .eq("id", origin.series_id)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (seriesFetchError) {
    return { data: null, error: seriesFetchError.message };
  }

  if (series) {
    const seriesUpdate: {
      recurrence_end_date?: string;
      status?: "cancelled";
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (scope === "all") {
      seriesUpdate.status = "cancelled";
    } else {
      const dayBefore = addCalendarDays(originOccurrenceDate, -1);
      if (dayBefore >= series.recurrence_start_date) {
        seriesUpdate.recurrence_end_date = dayBefore;
      } else {
        seriesUpdate.recurrence_end_date = series.recurrence_start_date;
        seriesUpdate.status = "cancelled";
      }
    }

    const { error: seriesUpdateError } = await db
      .from("booking_series")
      .update(seriesUpdate)
      .eq("id", origin.series_id)
      .eq("facility_id", facilityId);

    if (seriesUpdateError) {
      return { data: null, error: seriesUpdateError.message };
    }
  }

  return {
    data: {
      cancelledCount: toCancel.length,
      skippedCount,
    },
    error: null,
  };
}

export async function editBookingSeriesServer(
  db: ServerDb,
  facilityId: string,
  bookingId: string,
  scope: BookingSeriesCancelScope,
  fields: EditBookingSeriesFields,
  editedBy: "staff" | "client",
): Promise<ServerResult<EditBookingSeriesResult>> {
  if (!hasOccurrenceFields(fields)) {
    return { data: null, error: "No fields to update" };
  }

  if (scope === "this") {
    const result = await updateBookingOccurrenceFieldsServer(
      db,
      facilityId,
      bookingId,
      fields,
    );
    if (result.error) {
      return { data: null, error: result.error };
    }
    return { data: { updatedCount: 1, skippedCount: 0 }, error: null };
  }

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

  const origin = existing as BookingRow;
  if (!origin.series_id) {
    return { data: null, error: "Booking is not part of a series" };
  }

  const timeError = validateOccurrenceFieldTimes(origin, fields);
  if (timeError) {
    return { data: null, error: timeError };
  }

  const selection = await selectUnprotectedSeriesOccurrences(
    db,
    facilityId,
    origin,
    scope,
  );
  if (selection.error || !selection.data) {
    return { data: null, error: selection.error ?? "Failed to load series" };
  }

  const { ids: toUpdate, skippedCount } = selection.data;

  if (toUpdate.length > 0) {
    const { error: updateError } = await db
      .from("bookings")
      .update(toOccurrenceFieldUpdate(fields))
      .eq("facility_id", facilityId)
      .in("id", toUpdate);

    if (updateError) {
      return { data: null, error: updateError.message };
    }
  }

  return {
    data: {
      updatedCount: toUpdate.length,
      skippedCount,
    },
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

export async function getFacilityNotificationRecipients(
  db: ServerDb,
  facilityId: string,
): Promise<string[]> {
  const { data, error } = await db
    .from("profiles")
    .select("email")
    .eq("facility_id", facilityId)
    .eq("role", "admin");

  if (error || !data) return [];

  return data
    .map((row) => (row as { email: string }).email?.trim())
    .filter((email): email is string => Boolean(email));
}

export async function getFacilityNotificationPreferences(
  db: ServerDb,
  facilityId: string,
): Promise<FacilityNotificationPreferences> {
  const { data, error } = await db
    .from("facility_notification_preferences")
    .select("*")
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (error || !data) {
    return defaultNotificationPreferences(facilityId);
  }

  return mapFacilityNotificationPreferencesRowToFacilityNotificationPreferences(
    data as FacilityNotificationPreferencesRow,
  );
}
