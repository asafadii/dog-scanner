import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { canApproveBooking } from "@/lib/capacity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  BookingInsert,
  BookingRow,
  BookingUpdate,
  ClientRow,
  DogRow,
  ProfileRow,
} from "@/lib/supabase/types";
import type { Booking, BookingFormData, BookingStatus } from "@/lib/types";

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
): Booking {
  return {
    id: row.id,
    facilityId: row.facility_id,
    clientId: row.client_id,
    dogId: row.dog_id,
    serviceType: row.service_type,
    startDate: row.start_date,
    endDate: row.end_date,
    transportRequired: row.transport_required,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName,
    dogName,
    dogBreed,
  };
}

export function bookingToFormData(booking: Booking): BookingFormData {
  return {
    clientId: booking.clientId,
    dogId: booking.dogId,
    serviceType: booking.serviceType,
    startDate: booking.startDate,
    endDate: booking.endDate,
    transportRequired: booking.transportRequired,
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
    transport_required: input.transportRequired,
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
  if (input.transportRequired !== undefined) {
    update.transport_required = input.transportRequired;
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

export async function createBooking(
  input: BookingFormData,
): Promise<BookingsResult<Booking>> {
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

  return { data: booking, error: null };
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

export { INCOMPLETE_SETUP_MESSAGE };
