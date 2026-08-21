import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  FacilityNotificationPreferencesRow,
  ProfileRow,
} from "@/lib/supabase/types";
import type { FacilityNotificationPreferences } from "@/lib/types";

export { INCOMPLETE_SETUP_MESSAGE };

export type NotificationErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "unknown";

export interface NotificationError {
  message: string;
  code: NotificationErrorCode;
}

type NotificationResult<T> =
  | { data: T; error: null }
  | { data: null; error: NotificationError };

export type NotificationPreferencesFormData = Pick<
  FacilityNotificationPreferences,
  | "notifyNewBooking"
  | "notifyReturningDogBooking"
  | "notifyBookingCancelledByClient"
>;

function toError(
  message: string,
  code: NotificationErrorCode = "unknown",
): NotificationError {
  return { message, code };
}

export function mapFacilityNotificationPreferencesRowToFacilityNotificationPreferences(
  row: FacilityNotificationPreferencesRow,
): FacilityNotificationPreferences {
  return {
    facilityId: row.facility_id,
    notifyNewBooking: row.notify_new_booking,
    notifyReturningDogBooking: row.notify_returning_dog_booking,
    notifyBookingCancelledByClient: row.notify_booking_cancelled_by_client,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function defaultNotificationPreferences(
  facilityId: string,
): FacilityNotificationPreferences {
  return {
    facilityId,
    notifyNewBooking: true,
    notifyReturningDogBooking: true,
    notifyBookingCancelledByClient: true,
    createdAt: null,
    updatedAt: null,
  };
}

async function requireProfile(): Promise<NotificationResult<ProfileRow>> {
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

export async function getFacilityNotificationPreferences(): Promise<
  NotificationResult<FacilityNotificationPreferences>
> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("facility_notification_preferences")
    .select("*")
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: defaultNotificationPreferences(facilityId), error: null };
  }

  return {
    data: mapFacilityNotificationPreferencesRowToFacilityNotificationPreferences(
      data as FacilityNotificationPreferencesRow,
    ),
    error: null,
  };
}

export async function updateFacilityNotificationPreferences(
  input: NotificationPreferencesFormData,
): Promise<NotificationResult<FacilityNotificationPreferences>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("facility_notification_preferences")
    .upsert(
      {
        facility_id: facilityId,
        notify_new_booking: input.notifyNewBooking,
        notify_returning_dog_booking: input.notifyReturningDogBooking,
        notify_booking_cancelled_by_client:
          input.notifyBookingCancelledByClient,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "facility_id" },
    )
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: mapFacilityNotificationPreferencesRowToFacilityNotificationPreferences(
      data as FacilityNotificationPreferencesRow,
    ),
    error: null,
  };
}
