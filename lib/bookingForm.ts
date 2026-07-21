import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/supabase/types";
import type { BookingFormConfig } from "@/lib/types";
import { LOCKED_BOOKING_FORM_FIELDS } from "@/lib/types";

export type BookingFormErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "validation"
  | "unknown";

export interface BookingFormError {
  message: string;
  code: BookingFormErrorCode;
}

type BookingFormResult<T> =
  | { data: T; error: null }
  | { data: null; error: BookingFormError };

function toError(
  message: string,
  code: BookingFormErrorCode = "unknown",
): BookingFormError {
  return { message, code };
}

async function requireProfile(): Promise<BookingFormResult<ProfileRow>> {
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

function isBookingFormConfig(value: unknown): value is BookingFormConfig {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const states = new Set(["hidden", "optional", "required"]);
  return Object.values(value as Record<string, unknown>).every(
    (state) => typeof state === "string" && states.has(state),
  );
}

export async function getBookingFormConfig(): Promise<
  BookingFormResult<BookingFormConfig>
> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("facilities")
    .select("booking_form_config")
    .eq("id", profileResult.data.facility_id)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Facility not found") };
  }

  const raw = (data as { booking_form_config: unknown }).booking_form_config;
  if (raw == null) {
    return { data: {}, error: null };
  }

  if (!isBookingFormConfig(raw)) {
    return { data: {}, error: null };
  }

  return { data: raw, error: null };
}

export async function saveBookingFormConfig(
  config: BookingFormConfig,
): Promise<BookingFormResult<true>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  for (const key of LOCKED_BOOKING_FORM_FIELDS) {
    if (key in config && config[key] !== "required") {
      return {
        data: null,
        error: toError(
          `"${key}" is always required and cannot be changed.`,
          "validation",
        ),
      };
    }
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("facilities")
    .update({ booking_form_config: config })
    .eq("id", profileResult.data.facility_id);

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: true, error: null };
}
