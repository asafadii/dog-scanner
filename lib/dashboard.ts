import { getActiveCheckins } from "@/lib/checkins";
import { getTodaysBookings } from "@/lib/bookings";
import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BookingRow, ProfileRow } from "@/lib/supabase/types";

export type DashboardErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "unknown";

export interface DashboardError {
  message: string;
  code: DashboardErrorCode;
}

type DashboardResult<T> =
  | { data: T; error: null }
  | { data: null; error: DashboardError };

export interface DashboardKpiStats {
  checkedIn: number;
  arrivalsToday: number;
  daycareToday: number;
  overnight: number;
}

function toError(
  message: string,
  code: DashboardErrorCode = "unknown",
): DashboardError {
  return { message, code };
}

async function requireProfile(): Promise<DashboardResult<ProfileRow>> {
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

export async function getDashboardKpiStats(): Promise<
  DashboardResult<DashboardKpiStats>
> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const [checkinsResult, bookingsResult] = await Promise.all([
    getActiveCheckins(),
    getTodaysBookings(),
  ]);

  if (checkinsResult.error) {
    return { data: null, error: toError(checkinsResult.error.message) };
  }

  if (bookingsResult.error) {
    return { data: null, error: toError(bookingsResult.error.message) };
  }

  const activeCheckins = checkinsResult.data;
  const checkedInDogIds = new Set(activeCheckins.map((checkin) => checkin.dog_id));

  const arrivalsToday = bookingsResult.data.filter(
    (booking) => !checkedInDogIds.has(booking.dogId),
  ).length;

  const bookingIds = [
    ...new Set(
      activeCheckins
        .map((checkin) => checkin.booking_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let daycareToday = 0;
  let overnight = 0;

  if (bookingIds.length > 0) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, service_type")
      .eq("facility_id", profileResult.data.facility_id)
      .in("id", bookingIds);

    if (error) {
      return { data: null, error: toError(error.message) };
    }

    const serviceByBookingId = new Map(
      (data as Pick<BookingRow, "id" | "service_type">[]).map((row) => [
        row.id,
        row.service_type,
      ]),
    );

    for (const checkin of activeCheckins) {
      if (!checkin.booking_id) {
        daycareToday += 1;
        continue;
      }

      const serviceType = serviceByBookingId.get(checkin.booking_id);
      if (serviceType === "boarding") {
        overnight += 1;
      } else {
        daycareToday += 1;
      }
    }
  } else if (activeCheckins.length > 0) {
    daycareToday = activeCheckins.length;
  }

  return {
    data: {
      checkedIn: activeCheckins.length,
      arrivalsToday,
      daycareToday,
      overnight,
    },
    error: null,
  };
}
