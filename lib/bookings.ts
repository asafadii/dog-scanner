import { canApproveBooking } from "@/lib/capacity";
import { clarity } from "@/lib/clarity";
import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  BookingInsert,
  BookingRow,
  BookingSeriesInsert,
  BookingSeriesRow,
  BookingUpdate,
  ClientRow,
  DogRow,
  ProfileRow,
} from "@/lib/supabase/types";
import type {
  Booking,
  BookingFormData,
  BookingHistorySeriesStatus,
  BookingSeries,
  BookingSeriesCancelScope,
  BookingStatus,
  CancelBookingSeriesResult,
  DogBookingHistoryEntry,
  DogBookingHistoryPage,
  EditBookingSeriesFields,
  EditBookingSeriesResult,
  FoodSource,
  RecurringBookingInput,
} from "@/lib/types";
import {
  enumerateRecurringOccurrences,
  formatLocalDateString,
  MAX_RECURRING_OCCURRENCES,
} from "@/lib/recurrence";

export type BookingsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "capacity_exceeded"
  | "unknown";

export interface BookingsError {
  message: string;
  code: BookingsErrorCode;
}

type BookingsResult<T> =
  | { data: T; error: null }
  | { data: null; error: BookingsError };

export type UpdateBookingInput = Partial<BookingFormData> & {
  status?: BookingStatus;
};

function toError(
  message: string,
  code: BookingsErrorCode = "unknown",
): BookingsError {
  return { message, code };
}

export function parseFoodSource(value: unknown): FoodSource | null {
  if (value === "own" || value === "facility") return value;
  return null;
}

const BOOKING_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d/;

export function normalizeBookingTime(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!BOOKING_TIME_PATTERN.test(trimmed)) return null;
  return trimmed.slice(0, 5);
}

function timeToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function mapBookingRowToBooking(
  row: BookingRow,
  clientName = "",
  dogName = "",
  dogBreed = "",
  dogPhotoUrl: string | null = null,
): Booking {
  return {
    id: row.id,
    facilityId: row.facility_id,
    clientId: row.client_id,
    dogId: row.dog_id,
    serviceType: row.service_type,
    startDate: row.start_date,
    endDate: row.end_date,
    arrivalTime: normalizeBookingTime(row.arrival_time),
    endTime: normalizeBookingTime(row.end_time),
    transportRequired: row.transport_required,
    status: row.status,
    cancelledBy: row.cancelled_by ?? null,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName,
    dogName,
    dogBreed,
    dogPhotoUrl,
    seriesId: row.series_id ?? null,
    seriesOccurrenceDate: row.series_occurrence_date ?? null,
    foodSource: row.food_source ?? null,
  };
}

export function bookingToFormData(booking: Booking): BookingFormData {
  return {
    clientId: booking.clientId,
    dogId: booking.dogId,
    serviceType: booking.serviceType,
    startDate: booking.startDate,
    endDate: booking.endDate,
    arrivalTime: booking.arrivalTime ?? "",
    endTime: booking.endTime ?? "",
    transportRequired: booking.transportRequired,
    foodSource: booking.foodSource,
    notes: booking.notes ?? "",
  };
}

function toBookingInsert(
  facilityId: string,
  input: BookingFormData,
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
  };
}

function toBookingUpdate(input: UpdateBookingInput): BookingUpdate {
  const update: BookingUpdate = {};

  if (input.clientId !== undefined) update.client_id = input.clientId;
  if (input.dogId !== undefined) update.dog_id = input.dogId;
  if (input.serviceType !== undefined) update.service_type = input.serviceType;
  if (input.startDate !== undefined) update.start_date = input.startDate;
  if (input.endDate !== undefined) update.end_date = input.endDate;
  if (input.arrivalTime !== undefined) {
    update.arrival_time = normalizeBookingTime(input.arrivalTime);
  }
  if (input.endTime !== undefined) {
    update.end_time = normalizeBookingTime(input.endTime);
  }
  if (input.transportRequired !== undefined) {
    update.transport_required = input.transportRequired;
  }
  if (input.foodSource !== undefined) {
    update.food_source = input.foodSource;
  }
  if (input.notes !== undefined) update.notes = input.notes.trim() || null;
  if (input.status !== undefined) update.status = input.status;

  return update;
}

async function requireProfile(): Promise<BookingsResult<ProfileRow>> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: toError("Not signed in", "unauthorized") };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { data: null, error: toError(profileError.message) };
  }

  if (!profile) {
    return {
      data: null,
      error: toError(INCOMPLETE_SETUP_MESSAGE, "incomplete_setup"),
    };
  }

  return { data: profile as ProfileRow, error: null };
}

async function enrichBookings(
  rows: BookingRow[],
  facilityId: string,
): Promise<Booking[]> {
  if (rows.length === 0) return [];

  const clientIds = [...new Set(rows.map((row) => row.client_id))];
  const dogIds = [...new Set(rows.map((row) => row.dog_id))];
  const supabase = createSupabaseBrowserClient();

  const [clientsResult, dogsResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name")
      .eq("facility_id", facilityId)
      .in("id", clientIds),
    supabase
      .from("dogs")
      .select("id, name, breed, photo_url")
      .eq("facility_id", facilityId)
      .in("id", dogIds),
  ]);

  const clientNames = new Map<string, string>();
  for (const client of (clientsResult.data ?? []) as Pick<ClientRow, "id" | "name">[]) {
    clientNames.set(client.id, client.name);
  }

  const dogInfo = new Map<
    string,
    { name: string; breed: string; photoUrl: string | null }
  >();
  for (const dog of (dogsResult.data ?? []) as Pick<
    DogRow,
    "id" | "name" | "breed" | "photo_url"
  >[]) {
    dogInfo.set(dog.id, {
      name: dog.name,
      breed: dog.breed,
      photoUrl: dog.photo_url,
    });
  }

  return rows.map((row) => {
    const dog = dogInfo.get(row.dog_id);
    return mapBookingRowToBooking(
      row,
      clientNames.get(row.client_id) ?? "Unknown client",
      dog?.name ?? "Unknown dog",
      dog?.breed ?? "",
      dog?.photoUrl ?? null,
    );
  });
}

async function fetchBookingsForFacility(
  facilityId: string,
  options?: {
    dogId?: string;
    statusIn?: BookingStatus[];
    startDateGte?: string;
    startDateLte?: string;
    endDateGte?: string;
    limit?: number;
  },
): Promise<BookingsResult<Booking[]>> {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from("bookings")
    .select("*")
    .eq("facility_id", facilityId)
    .order("start_date", { ascending: true });

  if (options?.dogId) {
    query = query.eq("dog_id", options.dogId);
  }
  if (options?.statusIn?.length) {
    query = query.in("status", options.statusIn);
  }
  if (options?.startDateGte) {
    query = query.gte("start_date", options.startDateGte);
  }
  if (options?.startDateLte) {
    query = query.lte("start_date", options.startDateLte);
  }
  if (options?.endDateGte) {
    query = query.gte("end_date", options.endDateGte);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: await enrichBookings(data as BookingRow[], facilityId),
    error: null,
  };
}

export async function getBookings(): Promise<BookingsResult<Booking[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  return fetchBookingsForFacility(profileResult.data.facility_id);
}

export async function getBookingById(
  id: string,
): Promise<BookingsResult<Booking>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .eq("facility_id", profileResult.data.facility_id)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Booking not found", "not_found") };
  }

  const [booking] = await enrichBookings(
    [data as BookingRow],
    profileResult.data.facility_id,
  );

  return { data: booking, error: null };
}

export function validateBookingTimes(
  input: {
    startDate: string;
    endDate: string;
    arrivalTime?: string | null;
    endTime?: string | null;
  },
  prefix = "",
): BookingsError | null {
  const arrivalRaw = input.arrivalTime?.trim() ?? "";
  const endRaw = input.endTime?.trim() ?? "";
  const arrivalTime = normalizeBookingTime(arrivalRaw);
  const endTime = normalizeBookingTime(endRaw);

  if (arrivalRaw && !arrivalTime) {
    return toError(`${prefix}Arrival time is invalid`);
  }

  if (endRaw && !endTime) {
    return toError(`${prefix}Pickup time is invalid`);
  }

  if (
    input.startDate === input.endDate &&
    arrivalTime &&
    endTime &&
    timeToMinutes(endTime) <= timeToMinutes(arrivalTime)
  ) {
    return toError(`${prefix}Pickup time must be after arrival time`);
  }

  return null;
}

export function validateBookingFormData(
  input: BookingFormData,
  rowLabel?: string,
): BookingsError | null {
  const prefix = rowLabel ? `${rowLabel}: ` : "";

  if (
    !input.clientId?.trim() ||
    !input.dogId?.trim() ||
    (input.serviceType !== "daycare" && input.serviceType !== "boarding") ||
    !input.startDate?.trim() ||
    !input.endDate?.trim()
  ) {
    return toError(`${prefix}Missing required booking fields`);
  }

  if (input.endDate < input.startDate) {
    return toError(`${prefix}End date must be on or after start date`);
  }

  return validateBookingTimes(input, prefix);
}

export async function createBooking(
  input: BookingFormData,
): Promise<BookingsResult<Booking>> {
  const validationError = validateBookingFormData(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert(toBookingInsert(profileResult.data.facility_id, input))
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  const [booking] = await enrichBookings(
    [data as BookingRow],
    profileResult.data.facility_id,
  );

  clarity("event", "booking_created");
  return { data: booking, error: null };
}

export async function createBookings(
  inputs: BookingFormData[],
): Promise<BookingsResult<BookingRow[]>> {
  if (inputs.length === 0) {
    return { data: null, error: toError("No bookings to create") };
  }

  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  for (let index = 0; index < inputs.length; index += 1) {
    const validationError = validateBookingFormData(
      inputs[index],
      `Date ${index + 1}`,
    );
    if (validationError) {
      return { data: null, error: validationError };
    }
  }

  const inserts = inputs.map((input) =>
    toBookingInsert(profileResult.data.facility_id, input),
  );

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert(inserts)
    .select("*");

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  clarity("event", "booking_created");
  return { data: (data ?? []) as BookingRow[], error: null };
}

export function mapBookingSeriesRowToBookingSeries(
  row: BookingSeriesRow,
): BookingSeries {
  return {
    id: row.id,
    facilityId: row.facility_id,
    clientId: row.client_id,
    dogId: row.dog_id,
    serviceType: row.service_type,
    recurrenceFreq: row.recurrence_freq,
    recurrenceDaysOfWeek: row.recurrence_days_of_week,
    recurrenceStartDate: row.recurrence_start_date,
    recurrenceEndDate: row.recurrence_end_date,
    arrivalTime: normalizeBookingTime(row.arrival_time),
    endTime: normalizeBookingTime(row.end_time),
    transportRequired: row.transport_required,
    foodSource: row.food_source,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateRecurringBookingInput(
  input: RecurringBookingInput,
): BookingsError | null {
  const days = input.recurrenceDaysOfWeek;

  if (
    !input.clientId?.trim() ||
    !input.dogId?.trim() ||
    (input.serviceType !== "daycare" && input.serviceType !== "boarding") ||
    !input.recurrenceStartDate?.trim() ||
    !input.recurrenceEndDate?.trim()
  ) {
    return toError("Missing required booking fields");
  }

  if (
    input.recurrenceFreq !== "weekly" &&
    input.recurrenceFreq !== "biweekly"
  ) {
    return toError("Repeat frequency must be weekly or every 2 weeks");
  }

  if (input.recurrenceEndDate < input.recurrenceStartDate) {
    return toError("Series end date must be on or after the start date");
  }

  if (!Array.isArray(days) || days.length === 0) {
    return toError("Select at least one day of the week");
  }

  if (days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    return toError("Days of the week are invalid");
  }

  const firstEndDate =
    input.serviceType === "daycare"
      ? input.recurrenceStartDate
      : input.endDate;

  const occurrenceValidation = validateBookingFormData({
    clientId: input.clientId,
    dogId: input.dogId,
    serviceType: input.serviceType,
    startDate: input.recurrenceStartDate,
    endDate: firstEndDate,
    arrivalTime: input.arrivalTime,
    endTime: input.endTime,
    transportRequired: input.transportRequired,
    foodSource: input.foodSource,
    notes: input.notes,
  });
  if (occurrenceValidation) {
    return occurrenceValidation;
  }

  const occurrences = enumerateRecurringOccurrences({
    ...input,
    endDate: firstEndDate,
  });

  if (occurrences.length === 0) {
    return toError(
      "No visits match this pattern. Choose different days or dates.",
    );
  }

  if (occurrences.length > MAX_RECURRING_OCCURRENCES) {
    return toError(
      `This pattern would create ${occurrences.length} visits. The maximum is ${MAX_RECURRING_OCCURRENCES}.`,
    );
  }

  return null;
}

export async function createRecurringBooking(
  input: RecurringBookingInput,
): Promise<BookingsResult<{ series: BookingSeries; bookings: BookingRow[] }>> {
  const validationError = validateRecurringBookingInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const firstEndDate =
    input.serviceType === "daycare"
      ? input.recurrenceStartDate
      : input.endDate;
  const occurrences = enumerateRecurringOccurrences({
    ...input,
    endDate: firstEndDate,
  });
  const arrivalTime = normalizeBookingTime(input.arrivalTime);
  const endTime = normalizeBookingTime(input.endTime);
  const notes = input.notes.trim() || null;
  const foodSource = input.foodSource ?? null;
  const daysOfWeek = [...new Set(input.recurrenceDaysOfWeek)].sort(
    (a, b) => a - b,
  );

  const seriesInsert: BookingSeriesInsert = {
    facility_id: profileResult.data.facility_id,
    client_id: input.clientId,
    dog_id: input.dogId,
    service_type: input.serviceType,
    recurrence_freq: input.recurrenceFreq,
    recurrence_days_of_week: daysOfWeek,
    recurrence_start_date: input.recurrenceStartDate,
    recurrence_end_date: input.recurrenceEndDate,
    arrival_time: arrivalTime,
    end_time: endTime,
    transport_required: input.transportRequired,
    food_source: foodSource,
    notes,
    status: "active",
  };

  const supabase = createSupabaseBrowserClient();
  const { data: seriesRow, error: seriesError } = await supabase
    .from("booking_series")
    .insert(seriesInsert)
    .select("*")
    .single();

  if (seriesError || !seriesRow) {
    return {
      data: null,
      error: toError(seriesError?.message ?? "Failed to create booking series"),
    };
  }

  const series = seriesRow as BookingSeriesRow;
  const inserts: BookingInsert[] = occurrences.map((occurrence) => ({
    facility_id: profileResult.data.facility_id,
    client_id: input.clientId,
    dog_id: input.dogId,
    service_type: input.serviceType,
    start_date: occurrence.startDate,
    end_date: occurrence.endDate,
    arrival_time: arrivalTime,
    end_time: endTime,
    transport_required: input.transportRequired,
    food_source: foodSource,
    status: "pending",
    notes,
    series_id: series.id,
    series_occurrence_date: occurrence.startDate,
  }));

  const { data: bookingRows, error: bookingsError } = await supabase
    .from("bookings")
    .insert(inserts)
    .select("*");

  if (bookingsError || !bookingRows || bookingRows.length === 0) {
    await supabase.from("booking_series").delete().eq("id", series.id);
    return {
      data: null,
      error: toError(bookingsError?.message ?? "Failed to create bookings"),
    };
  }

  clarity("event", "booking_created");
  return {
    data: {
      series: mapBookingSeriesRowToBookingSeries(series),
      bookings: bookingRows as BookingRow[],
    },
    error: null,
  };
}

export async function updateBooking(
  id: string,
  input: UpdateBookingInput,
): Promise<BookingsResult<Booking>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const update = toBookingUpdate(input);
  if (Object.keys(update).length === 0) {
    return getBookingById(id);
  }

  if (
    input.clientId &&
    input.dogId &&
    input.serviceType &&
    input.startDate &&
    input.endDate
  ) {
    const validationError = validateBookingFormData({
      clientId: input.clientId,
      dogId: input.dogId,
      serviceType: input.serviceType,
      startDate: input.startDate,
      endDate: input.endDate,
      arrivalTime: input.arrivalTime,
      endTime: input.endTime,
      transportRequired: input.transportRequired ?? false,
      notes: input.notes ?? "",
    });
    if (validationError) {
      return { data: null, error: validationError };
    }
  }

  if (input.status === "approved") {
    const approvalCheck = await canApproveBooking(id);
    if (approvalCheck.error) {
      return { data: null, error: toError(approvalCheck.error.message) };
    }
    if (!approvalCheck.data.canApprove) {
      return {
        data: null,
        error: toError(
          approvalCheck.data.message ??
            "This booking cannot be approved because capacity is full.",
          "capacity_exceeded",
        ),
      };
    }
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("facility_id", profileResult.data.facility_id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Booking not found", "not_found") };
  }

  const [booking] = await enrichBookings(
    [data as BookingRow],
    profileResult.data.facility_id,
  );

  return { data: booking, error: null };
}

export async function getDogBookings(
  dogId: string,
): Promise<BookingsResult<Booking[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  return fetchBookingsForFacility(profileResult.data.facility_id, { dogId });
}

export async function getUpcomingBookings(
  limit = 5,
): Promise<BookingsResult<Booking[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  return fetchBookingsForFacility(profileResult.data.facility_id, {
    startDateGte: todayDateString(),
    statusIn: ["pending", "approved"],
    limit,
  });
}

export async function getTodaysBookings(): Promise<BookingsResult<Booking[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const today = todayDateString();
  return fetchBookingsForFacility(profileResult.data.facility_id, {
    startDateLte: today,
    endDateGte: today,
    statusIn: ["pending", "approved"],
  });
}

export async function updateBookingServiceType(
  bookingId: string,
  serviceType: BookingFormData["serviceType"],
): Promise<BookingsResult<Booking>> {
  return updateBooking(bookingId, { serviceType });
}

function formatSeriesMutationResult(
  count: number,
  skippedCount: number,
  verb: "cancelled" | "updated",
): string {
  if (skippedCount === 0) {
    return count === 1 ? `1 visit ${verb}.` : `${count} visits ${verb}.`;
  }

  const total = count + skippedCount;
  const skippedVerb = skippedCount === 1 ? "was" : "were";
  return `${count} of ${total} upcoming visits ${verb} — ${skippedCount} already checked in, paid, or already occurred and ${skippedVerb} left as-is.`;
}

export function formatSeriesCancelResult(
  cancelledCount: number,
  skippedCount: number,
): string {
  return formatSeriesMutationResult(cancelledCount, skippedCount, "cancelled");
}

export function formatSeriesEditResult(
  updatedCount: number,
  skippedCount: number,
): string {
  return formatSeriesMutationResult(updatedCount, skippedCount, "updated");
}

export async function cancelBookingSeries(
  bookingId: string,
  scope: BookingSeriesCancelScope,
): Promise<BookingsResult<CancelBookingSeriesResult>> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    return { data: null, error: toError("Not signed in", "unauthorized") };
  }

  const response = await fetch(`/api/bookings/${bookingId}/cancel-series`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ scope }),
  });

  const result = (await response.json()) as
    | { ok: true; data: CancelBookingSeriesResult }
    | { ok: false; error: string };

  if (!response.ok || !result.ok) {
    return {
      data: null,
      error: toError(!result.ok ? result.error : "Failed to cancel bookings"),
    };
  }

  return { data: result.data, error: null };
}

export async function editBookingSeries(
  bookingId: string,
  scope: BookingSeriesCancelScope,
  fields: EditBookingSeriesFields,
): Promise<BookingsResult<EditBookingSeriesResult>> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    return { data: null, error: toError("Not signed in", "unauthorized") };
  }

  const response = await fetch(`/api/bookings/${bookingId}/edit-series`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ scope, ...fields }),
  });

  const result = (await response.json()) as
    | { ok: true; data: EditBookingSeriesResult }
    | { ok: false; error: string };

  if (!response.ok || !result.ok) {
    return {
      data: null,
      error: toError(!result.ok ? result.error : "Failed to update bookings"),
    };
  }

  return { data: result.data, error: null };
}

function groupKey(row: BookingRow): string {
  return row.series_id ?? row.id;
}

function pickHistoryRepresentative(
  rows: BookingRow[],
  today: string,
): BookingRow {
  const upcoming = rows
    .filter((row) => row.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (upcoming[0]) return upcoming[0];

  return [...rows].sort((a, b) =>
    b.start_date.localeCompare(a.start_date),
  )[0]!;
}

function resolveSeriesHistoryStatus(
  series: BookingSeries,
  occurrenceRows: BookingRow[],
  today: string,
): BookingHistorySeriesStatus {
  if (series.status === "cancelled") return "cancelled";
  if (series.recurrenceEndDate < today) return "completed";

  const hasFuture = occurrenceRows.some(
    (row) => row.start_date >= today && row.status !== "cancelled",
  );
  return hasFuture ? "active" : "completed";
}

export async function assembleDogBookingHistoryPage(
  bookingRows: BookingRow[],
  seriesById: Map<string, BookingSeries>,
  facilityId: string,
  options: { limit: number; offset: number },
  enrich: (rows: BookingRow[], facilityId: string) => Promise<Booking[]>,
): Promise<DogBookingHistoryPage> {
  const today = formatLocalDateString(new Date());
  const groups = new Map<string, BookingRow[]>();

  for (const row of bookingRows) {
    const key = groupKey(row);
    const existing = groups.get(key);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  const grouped = [...groups.values()].map((rows) => ({
    representative: pickHistoryRepresentative(rows, today),
    rows,
  }));

  grouped.sort((a, b) =>
    b.representative.start_date.localeCompare(a.representative.start_date),
  );

  const limit = Math.max(0, options.limit);
  const offset = Math.max(0, options.offset);
  const page = grouped.slice(offset, offset + limit);

  const enriched = await enrich(
    page.map((group) => group.representative),
    facilityId,
  );
  const bookingById = new Map(enriched.map((booking) => [booking.id, booking]));

  const entries: DogBookingHistoryEntry[] = [];
  for (const group of page) {
    const booking = bookingById.get(group.representative.id);
    if (!booking) continue;

    const seriesId = group.representative.series_id;
    const series = seriesId ? (seriesById.get(seriesId) ?? null) : null;

    entries.push({
      booking,
      series,
      occurrenceCount: group.rows.length,
      seriesStatus: series
        ? resolveSeriesHistoryStatus(series, group.rows, today)
        : null,
    });
  }

  return {
    entries,
    hasMore: grouped.length > offset + limit,
  };
}

async function fetchSeriesByIds(
  facilityId: string,
  seriesIds: string[],
): Promise<BookingsResult<Map<string, BookingSeries>>> {
  const seriesById = new Map<string, BookingSeries>();
  if (seriesIds.length === 0) {
    return { data: seriesById, error: null };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("booking_series")
    .select("*")
    .eq("facility_id", facilityId)
    .in("id", seriesIds);

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  for (const row of (data ?? []) as BookingSeriesRow[]) {
    seriesById.set(row.id, mapBookingSeriesRowToBookingSeries(row));
  }

  return { data: seriesById, error: null };
}

export async function getDogBookingHistory(
  dogId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<BookingsResult<DogBookingHistoryPage>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("facility_id", facilityId)
    .eq("dog_id", dogId)
    .order("start_date", { ascending: false });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  const bookingRows = (data ?? []) as BookingRow[];
  const seriesIds = [
    ...new Set(
      bookingRows
        .map((row) => row.series_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const seriesResult = await fetchSeriesByIds(facilityId, seriesIds);
  if (seriesResult.error) {
    return { data: null, error: seriesResult.error };
  }

  return {
    data: await assembleDogBookingHistoryPage(
      bookingRows,
      seriesResult.data,
      facilityId,
      {
        limit: options.limit ?? 2,
        offset: options.offset ?? 0,
      },
      enrichBookings,
    ),
    error: null,
  };
}

export async function getBookingSeriesOccurrences(
  seriesId: string,
): Promise<BookingsResult<{ series: BookingSeries; occurrences: Booking[] }>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const supabase = createSupabaseBrowserClient();

  const { data: seriesData, error: seriesError } = await supabase
    .from("booking_series")
    .select("*")
    .eq("id", seriesId)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (seriesError) {
    return { data: null, error: toError(seriesError.message) };
  }

  if (!seriesData) {
    return { data: null, error: toError("Series not found", "not_found") };
  }

  const { data: occurrenceData, error: occurrenceError } = await supabase
    .from("bookings")
    .select("*")
    .eq("facility_id", facilityId)
    .eq("series_id", seriesId)
    .order("start_date", { ascending: true });

  if (occurrenceError) {
    return { data: null, error: toError(occurrenceError.message) };
  }

  return {
    data: {
      series: mapBookingSeriesRowToBookingSeries(seriesData as BookingSeriesRow),
      occurrences: await enrichBookings(
        (occurrenceData ?? []) as BookingRow[],
        facilityId,
      ),
    },
    error: null,
  };
}

export { INCOMPLETE_SETUP_MESSAGE };
