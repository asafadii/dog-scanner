import {
  assembleDogBookingHistoryPage,
  mapBookingRowToBooking,
  mapBookingSeriesRowToBookingSeries,
} from "@/lib/bookings";
import { portalFetch } from "@/lib/portal/api";
import {
  requireClientAccount,
  verifyLinkedClient,
} from "@/lib/portal/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  BookingRow,
  BookingSeriesRow,
  ClientRow,
  DogRow,
} from "@/lib/supabase/types";
import type {
  Booking,
  BookingFormData,
  BookingSeries,
  BookingSeriesCancelScope,
  CancelBookingSeriesResult,
  DogBookingHistoryPage,
  EditBookingSeriesFields,
  EditBookingSeriesResult,
  RecurringBookingInput,
} from "@/lib/types";

export type PortalBookingsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "account_closed"
  | "not_found"
  | "unknown";

export interface PortalBookingsError {
  message: string;
  code: PortalBookingsErrorCode;
}

type PortalBookingsResult<T> =
  | { data: T; error: null }
  | { data: null; error: PortalBookingsError };

function toError(
  message: string,
  code: PortalBookingsErrorCode = "unknown",
): PortalBookingsError {
  return { message, code };
}

export interface PortalCreateBookingInput extends BookingFormData {
  facilityId: string;
}

export interface CreatePortalBookingSuccessResponse {
  ok: true;
  booking: Booking;
}

export interface CreatePortalBookingErrorResponse {
  ok: false;
  error: string;
}

export type CreatePortalBookingResponse =
  | CreatePortalBookingSuccessResponse
  | CreatePortalBookingErrorResponse;

async function enrichPortalBookings(
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
      .select("id, name, breed")
      .eq("facility_id", facilityId)
      .in("id", dogIds),
  ]);

  const clientNames = new Map<string, string>();
  for (const client of (clientsResult.data ?? []) as Pick<ClientRow, "id" | "name">[]) {
    clientNames.set(client.id, client.name);
  }

  const dogInfo = new Map<string, { name: string; breed: string }>();
  for (const dog of (dogsResult.data ?? []) as Pick<DogRow, "id" | "name" | "breed">[]) {
    dogInfo.set(dog.id, { name: dog.name, breed: dog.breed });
  }

  return rows.map((row) => {
    const dog = dogInfo.get(row.dog_id);
    return mapBookingRowToBooking(
      row,
      clientNames.get(row.client_id) ?? "Unknown client",
      dog?.name ?? "Unknown dog",
      dog?.breed ?? "",
    );
  });
}

export async function getPortalBookings(
  clientId: string,
  facilityId: string,
): Promise<PortalBookingsResult<Booking[]>> {
  const accountResult = await requireClientAccount();
  if (accountResult.error) {
    return { data: null, error: accountResult.error };
  }

  const linkResult = await verifyLinkedClient(clientId, facilityId);
  if (linkResult.error) {
    return { data: null, error: linkResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
    .order("start_date", { ascending: false });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: await enrichPortalBookings(data as BookingRow[], facilityId),
    error: null,
  };
}

export async function getPortalBookingById(
  bookingId: string,
  clientId: string,
  facilityId: string,
): Promise<PortalBookingsResult<Booking>> {
  const accountResult = await requireClientAccount();
  if (accountResult.error) {
    return { data: null, error: accountResult.error };
  }

  const linkResult = await verifyLinkedClient(clientId, facilityId);
  if (linkResult.error) {
    return { data: null, error: linkResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Booking not found", "not_found") };
  }

  const [booking] = await enrichPortalBookings([data as BookingRow], facilityId);
  return { data: booking, error: null };
}

export async function getDogBookingHistory(
  dogId: string,
  clientId: string,
  facilityId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<PortalBookingsResult<DogBookingHistoryPage>> {
  const accountResult = await requireClientAccount();
  if (accountResult.error) {
    return { data: null, error: accountResult.error };
  }

  const linkResult = await verifyLinkedClient(clientId, facilityId);
  if (linkResult.error) {
    return { data: null, error: linkResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
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

  const seriesById = new Map<string, BookingSeries>();
  if (seriesIds.length > 0) {
    const { data: seriesData, error: seriesError } = await supabase
      .from("booking_series")
      .select("*")
      .eq("facility_id", facilityId)
      .eq("client_id", clientId)
      .in("id", seriesIds);

    if (seriesError) {
      return { data: null, error: toError(seriesError.message) };
    }

    for (const row of (seriesData ?? []) as BookingSeriesRow[]) {
      seriesById.set(row.id, mapBookingSeriesRowToBookingSeries(row));
    }
  }

  return {
    data: await assembleDogBookingHistoryPage(
      bookingRows,
      seriesById,
      facilityId,
      {
        limit: options.limit ?? 2,
        offset: options.offset ?? 0,
      },
      enrichPortalBookings,
    ),
    error: null,
  };
}

export async function getPortalBookingSeriesOccurrences(
  seriesId: string,
  clientId: string,
  facilityId: string,
): Promise<
  PortalBookingsResult<{ series: BookingSeries; occurrences: Booking[] }>
> {
  const accountResult = await requireClientAccount();
  if (accountResult.error) {
    return { data: null, error: accountResult.error };
  }

  const linkResult = await verifyLinkedClient(clientId, facilityId);
  if (linkResult.error) {
    return { data: null, error: linkResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data: seriesData, error: seriesError } = await supabase
    .from("booking_series")
    .select("*")
    .eq("id", seriesId)
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
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
    .eq("client_id", clientId)
    .eq("series_id", seriesId)
    .order("start_date", { ascending: true });

  if (occurrenceError) {
    return { data: null, error: toError(occurrenceError.message) };
  }

  return {
    data: {
      series: mapBookingSeriesRowToBookingSeries(seriesData as BookingSeriesRow),
      occurrences: await enrichPortalBookings(
        (occurrenceData ?? []) as BookingRow[],
        facilityId,
      ),
    },
    error: null,
  };
}

export async function createPortalBooking(
  input: PortalCreateBookingInput,
): Promise<PortalBookingsResult<Booking>> {
  const response = await portalFetch("/api/portal/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as CreatePortalBookingResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to create booking";
    return {
      data: null,
      error: toError(message, response.status === 403 ? "unauthorized" : "unknown"),
    };
  }

  return { data: data.booking, error: null };
}

export interface CreatePortalBookingsSuccessResponse {
  ok: true;
  bookings: Booking[];
}

export interface CreatePortalBookingsErrorResponse {
  ok: false;
  error: string;
}

export type CreatePortalBookingsResponse =
  | CreatePortalBookingsSuccessResponse
  | CreatePortalBookingsErrorResponse;

export async function createPortalBookings(
  inputs: PortalCreateBookingInput[],
): Promise<PortalBookingsResult<Booking[]>> {
  const response = await portalFetch("/api/portal/bookings/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookings: inputs }),
  });

  const data = (await response.json()) as CreatePortalBookingsResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to create bookings";
    return {
      data: null,
      error: toError(
        message,
        response.status === 403 ? "unauthorized" : "unknown",
      ),
    };
  }

  return { data: data.bookings, error: null };
}

export interface PortalCreateRecurringBookingInput extends RecurringBookingInput {
  facilityId: string;
}

export async function createPortalRecurringBooking(
  input: PortalCreateRecurringBookingInput,
): Promise<PortalBookingsResult<Booking[]>> {
  const response = await portalFetch("/api/portal/bookings/recurring", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as CreatePortalBookingsResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to create recurring booking";
    return {
      data: null,
      error: toError(
        message,
        response.status === 403 ? "unauthorized" : "unknown",
      ),
    };
  }

  return { data: data.bookings, error: null };
}

export interface CancelPortalBookingSuccessResponse {
  ok: true;
  data: true;
}

export interface CancelPortalBookingErrorResponse {
  ok: false;
  error: string;
}

export type CancelPortalBookingResponse =
  | CancelPortalBookingSuccessResponse
  | CancelPortalBookingErrorResponse;

export async function cancelPortalBooking(
  bookingId: string,
): Promise<PortalBookingsResult<true>> {
  const response = await portalFetch(
    `/api/portal/bookings/${bookingId}/cancel`,
    {
      method: "POST",
    },
  );

  const data = (await response.json()) as CancelPortalBookingResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to cancel booking";
    return {
      data: null,
      error: toError(
        message,
        response.status === 403 ? "unauthorized" : "unknown",
      ),
    };
  }

  return { data: true, error: null };
}

export interface CancelPortalBookingSeriesSuccessResponse {
  ok: true;
  data: CancelBookingSeriesResult;
}

export type CancelPortalBookingSeriesResponse =
  | CancelPortalBookingSeriesSuccessResponse
  | CancelPortalBookingErrorResponse;

export async function cancelPortalBookingSeries(
  bookingId: string,
  scope: BookingSeriesCancelScope,
): Promise<PortalBookingsResult<CancelBookingSeriesResult>> {
  const response = await portalFetch(
    `/api/portal/bookings/${bookingId}/cancel-series`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    },
  );

  const data = (await response.json()) as CancelPortalBookingSeriesResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to cancel bookings";
    return {
      data: null,
      error: toError(
        message,
        response.status === 403 ? "unauthorized" : "unknown",
      ),
    };
  }

  return { data: data.data, error: null };
}

export interface EditPortalBookingSeriesSuccessResponse {
  ok: true;
  data: EditBookingSeriesResult;
}

export type EditPortalBookingSeriesResponse =
  | EditPortalBookingSeriesSuccessResponse
  | CancelPortalBookingErrorResponse;

export async function editPortalBookingSeries(
  bookingId: string,
  scope: BookingSeriesCancelScope,
  fields: EditBookingSeriesFields,
): Promise<PortalBookingsResult<EditBookingSeriesResult>> {
  const response = await portalFetch(
    `/api/portal/bookings/${bookingId}/edit-series`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, ...fields }),
    },
  );

  const data = (await response.json()) as EditPortalBookingSeriesResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to update bookings";
    return {
      data: null,
      error: toError(
        message,
        response.status === 403 ? "unauthorized" : "unknown",
      ),
    };
  }

  return { data: data.data, error: null };
}
