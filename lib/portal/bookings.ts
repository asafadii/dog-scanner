import { mapBookingRowToBooking } from "@/lib/bookings";
import { portalFetch } from "@/lib/portal/api";
import {
  requireClientAccount,
  verifyLinkedClient,
} from "@/lib/portal/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BookingRow, ClientRow, DogRow } from "@/lib/supabase/types";
import type { Booking, BookingFormData } from "@/lib/types";

export type PortalBookingsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
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
