import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  BookingRow,
  FacilityCapacityRow,
  ProfileRow,
} from "@/lib/supabase/types";
import type {
  BookingFormData,
  CapacityFormData,
  CapacityUsage,
  FacilityCapacity,
} from "@/lib/types";

export const DEFAULT_DAYCARE_CAPACITY = 20;
export const DEFAULT_BOARDING_CAPACITY = 10;
export const CAPACITY_WARNING_THRESHOLD = 0.8;

export type CapacityErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "unknown";

export interface CapacityError {
  message: string;
  code: CapacityErrorCode;
}

type CapacityResult<T> =
  | { data: T; error: null }
  | { data: null; error: CapacityError };

export interface CanApproveBookingResult {
  canApprove: boolean;
  message: string | null;
}

function toError(
  message: string,
  code: CapacityErrorCode = "unknown",
): CapacityError {
  return { message, code };
}

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function enumerateDates(startDate: string, endDate: string): string[] {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const current = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const dates: string[] = [];

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function mapCapacityRow(row: FacilityCapacityRow): FacilityCapacity {
  return {
    facilityId: row.facility_id,
    daycareCapacity: row.daycare_capacity,
    boardingCapacity: row.boarding_capacity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function defaultCapacity(facilityId: string): FacilityCapacity {
  return {
    facilityId,
    daycareCapacity: DEFAULT_DAYCARE_CAPACITY,
    boardingCapacity: DEFAULT_BOARDING_CAPACITY,
    createdAt: null,
    updatedAt: null,
  };
}

async function requireProfile(): Promise<CapacityResult<ProfileRow>> {
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

async function countApprovedBookingsOnDate(
  facilityId: string,
  date: string,
  serviceType: "daycare" | "boarding",
  excludeBookingId?: string,
): Promise<number> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
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

export async function getFacilityCapacity(): Promise<
  CapacityResult<FacilityCapacity>
> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("facility_capacity")
    .select("*")
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: defaultCapacity(facilityId), error: null };
  }

  return { data: mapCapacityRow(data as FacilityCapacityRow), error: null };
}

export async function updateFacilityCapacity(
  input: CapacityFormData,
): Promise<CapacityResult<FacilityCapacity>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const daycareCapacity = Math.floor(input.daycareCapacity);
  const boardingCapacity = Math.floor(input.boardingCapacity);

  if (daycareCapacity < 1 || boardingCapacity < 1) {
    return {
      data: null,
      error: toError("Capacity must be at least 1."),
    };
  }

  const facilityId = profileResult.data.facility_id;
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("facility_capacity")
    .upsert(
      {
        facility_id: facilityId,
        daycare_capacity: daycareCapacity,
        boarding_capacity: boardingCapacity,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "facility_id" },
    )
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: mapCapacityRow(data as FacilityCapacityRow), error: null };
}

export async function getDaycareUsage(
  date: string,
): Promise<CapacityResult<CapacityUsage>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const capacityResult = await getFacilityCapacity();
  if (capacityResult.error) {
    return { data: null, error: capacityResult.error };
  }

  const used = await countApprovedBookingsOnDate(
    profileResult.data.facility_id,
    date,
    "daycare",
  );

  return {
    data: {
      used,
      capacity: capacityResult.data.daycareCapacity,
    },
    error: null,
  };
}

export async function getBoardingUsage(
  startDate: string,
  endDate: string,
): Promise<CapacityResult<CapacityUsage>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const capacityResult = await getFacilityCapacity();
  if (capacityResult.error) {
    return { data: null, error: capacityResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const dates = enumerateDates(startDate, endDate);
  let maxUsed = 0;

  for (const date of dates) {
    const used = await countApprovedBookingsOnDate(
      facilityId,
      date,
      "boarding",
    );
    maxUsed = Math.max(maxUsed, used);
  }

  return {
    data: {
      used: maxUsed,
      capacity: capacityResult.data.boardingCapacity,
    },
    error: null,
  };
}

async function wouldExceedCapacity(
  facilityId: string,
  serviceType: "daycare" | "boarding",
  startDate: string,
  endDate: string,
  capacityLimit: number,
  excludeBookingId?: string,
): Promise<{ exceeded: boolean; message: string | null }> {
  const dates = enumerateDates(startDate, endDate);
  const label = serviceType === "daycare" ? "Daycare" : "Boarding";

  for (const date of dates) {
    const used = await countApprovedBookingsOnDate(
      facilityId,
      date,
      serviceType,
      excludeBookingId,
    );

    if (used + 1 > capacityLimit) {
      return {
        exceeded: true,
        message: `${label} is full on ${formatCapacityDate(date)} (${used}/${capacityLimit} spots). This booking cannot be approved until capacity opens up.`,
      };
    }
  }

  return { exceeded: false, message: null };
}

function formatCapacityDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export async function canApproveBooking(
  bookingId: string,
): Promise<CapacityResult<CanApproveBookingResult>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("facility_id", profileResult.data.facility_id)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Booking not found", "not_found") };
  }

  const booking = data as BookingRow;
  const capacityResult = await getFacilityCapacity();
  if (capacityResult.error) {
    return { data: null, error: capacityResult.error };
  }

  const capacityLimit =
    booking.service_type === "daycare"
      ? capacityResult.data.daycareCapacity
      : capacityResult.data.boardingCapacity;

  const check = await wouldExceedCapacity(
    profileResult.data.facility_id,
    booking.service_type,
    booking.start_date,
    booking.end_date,
    capacityLimit,
    booking.id,
  );

  return {
    data: {
      canApprove: !check.exceeded,
      message: check.message,
    },
    error: null,
  };
}

export async function getBookingCapacityWarning(
  input: BookingFormData,
): Promise<CapacityResult<string | null>> {
  if (!input.startDate || !input.endDate || input.endDate < input.startDate) {
    return { data: null, error: null };
  }

  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const capacityResult = await getFacilityCapacity();
  if (capacityResult.error) {
    return { data: null, error: capacityResult.error };
  }

  const capacityLimit =
    input.serviceType === "daycare"
      ? capacityResult.data.daycareCapacity
      : capacityResult.data.boardingCapacity;

  const dates = enumerateDates(input.startDate, input.endDate);
  const label = input.serviceType === "daycare" ? "daycare" : "boarding";
  let peakUsed = 0;
  let peakDate = dates[0];

  for (const date of dates) {
    const used = await countApprovedBookingsOnDate(
      profileResult.data.facility_id,
      date,
      input.serviceType,
    );
    const projected = used + 1;
    if (projected > peakUsed) {
      peakUsed = projected;
      peakDate = date;
    }
  }

  const utilization = peakUsed / capacityLimit;
  if (utilization <= CAPACITY_WARNING_THRESHOLD) {
    return { data: null, error: null };
  }

  const percent = Math.round(utilization * 100);
  return {
    data: `${label.charAt(0).toUpperCase()}${label.slice(1)} is at ${percent}% capacity on ${formatCapacityDate(peakDate)} (${peakUsed}/${capacityLimit} spots) if this booking is approved. You can still submit the request.`,
    error: null,
  };
}

export async function getTodaysCapacityUsage(): Promise<
  CapacityResult<{
    daycare: CapacityUsage;
    boarding: CapacityUsage;
  }>
> {
  const today = todayDateString();
  const [daycareResult, boardingResult] = await Promise.all([
    getDaycareUsage(today),
    getBoardingUsage(today, today),
  ]);

  if (daycareResult.error) {
    return { data: null, error: daycareResult.error };
  }

  if (boardingResult.error) {
    return { data: null, error: boardingResult.error };
  }

  return {
    data: {
      daycare: daycareResult.data,
      boarding: boardingResult.data,
    },
    error: null,
  };
}

export { INCOMPLETE_SETUP_MESSAGE };
