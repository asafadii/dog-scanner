import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  BookingRow,
  DogCheckinRow,
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

function toLocalDateString(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addOneCalendarDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + 1);
  return toLocalDateString(next);
}

/** Active check-ins cover check-in date through today; completed ones cover through checkout date. */
function checkinCoversDate(
  checkedInAt: string,
  checkedOutAt: string | null,
  date: string,
  today: string,
): boolean {
  const checkInDate = toLocalDateString(checkedInAt);
  if (checkInDate > date) {
    return false;
  }

  if (checkedOutAt) {
    return toLocalDateString(checkedOutAt) >= date;
  }

  return date <= today;
}

async function countApprovedBookingsOnDate(
  facilityId: string,
  date: string,
  serviceType: "daycare" | "boarding",
  excludeBookingId?: string,
): Promise<number> {
  const supabase = createSupabaseBrowserClient();
  const today = todayDateString();
  const dayAfter = addOneCalendarDay(date);

  const [bookingsResult, checkinsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, dog_id")
      .eq("facility_id", facilityId)
      .eq("status", "approved")
      .eq("service_type", serviceType)
      .lte("start_date", date)
      .gte("end_date", date),
    supabase
      .from("dog_checkins")
      .select("dog_id, booking_id, checked_in_at, checked_out_at")
      .eq("facility_id", facilityId)
      .lt("checked_in_at", `${dayAfter}T23:59:59.999`)
      .or(`checked_out_at.is.null,checked_out_at.gte.${date}T00:00:00`),
  ]);

  const dogIds = new Set<string>();

  if (!bookingsResult.error && bookingsResult.data) {
    const rows = bookingsResult.data as Pick<BookingRow, "id" | "dog_id">[];
    for (const row of rows) {
      if (excludeBookingId && row.id === excludeBookingId) {
        continue;
      }
      dogIds.add(row.dog_id);
    }
  }

  if (!checkinsResult.error && checkinsResult.data) {
    const checkins = checkinsResult.data as Pick<
      DogCheckinRow,
      "dog_id" | "booking_id" | "checked_in_at" | "checked_out_at"
    >[];
    const covering = checkins.filter((checkin) =>
      checkinCoversDate(
        checkin.checked_in_at,
        checkin.checked_out_at,
        date,
        today,
      ),
    );

    const bookingIds = [
      ...new Set(
        covering
          .map((checkin) => checkin.booking_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const serviceByBookingId = new Map<string, "daycare" | "boarding">();
    if (bookingIds.length > 0) {
      const { data: linkedBookings } = await supabase
        .from("bookings")
        .select("id, service_type")
        .eq("facility_id", facilityId)
        .in("id", bookingIds);

      if (linkedBookings) {
        for (const row of linkedBookings as Pick<
          BookingRow,
          "id" | "service_type"
        >[]) {
          serviceByBookingId.set(row.id, row.service_type);
        }
      }
    }

    for (const checkin of covering) {
      // Walk-ins (no booking) count as daycare, matching check-in enrichment.
      const checkinServiceType = checkin.booking_id
        ? (serviceByBookingId.get(checkin.booking_id) ?? "daycare")
        : "daycare";

      if (checkinServiceType === serviceType) {
        dogIds.add(checkin.dog_id);
      }
    }
  }

  return dogIds.size;
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

export interface DayCapacityCount {
  date: string;
  daycare: number;
  overnight: number;
}

export async function getMonthlyCapacityCounts(
  year: number,
  month: number,
): Promise<CapacityResult<DayCapacityCount[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const monthStr = String(month).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    dates.push(`${year}-${monthStr}-${dayStr}`);
  }

  const counts = await Promise.all(
    dates.map(async (date) => {
      const [daycare, overnight] = await Promise.all([
        countApprovedBookingsOnDate(facilityId, date, "daycare"),
        countApprovedBookingsOnDate(facilityId, date, "boarding"),
      ]);
      return { date, daycare, overnight };
    }),
  );

  return { data: counts, error: null };
}

export { INCOMPLETE_SETUP_MESSAGE };
