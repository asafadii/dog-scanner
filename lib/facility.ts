import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FacilityRow, ProfileRow } from "@/lib/supabase/types";

export type FacilityErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "unknown";

export interface FacilityError {
  message: string;
  code: FacilityErrorCode;
}

type FacilityResult<T> =
  | { data: T; error: null }
  | { data: null; error: FacilityError };

export interface FacilitySettings {
  name: string | null;
  currency: string;
}

export const CURRENCY_OPTIONS = [
  { code: "EUR", label: "EUR — Euro (€)" },
  { code: "GBP", label: "GBP — British Pound (£)" },
  { code: "HUF", label: "HUF — Hungarian Forint (Ft)" },
  { code: "USD", label: "USD — US Dollar ($)" },
  { code: "CHF", label: "CHF — Swiss Franc (CHF)" },
  { code: "CZK", label: "CZK — Czech Koruna (Kč)" },
  { code: "PLN", label: "PLN — Polish Złoty (zł)" },
  { code: "RON", label: "RON — Romanian Leu (lei)" },
  { code: "SEK", label: "SEK — Swedish Krona (kr)" },
  { code: "NOK", label: "NOK — Norwegian Krone (kr)" },
  { code: "DKK", label: "DKK — Danish Krone (kr)" },
] as const;

function toError(
  message: string,
  code: FacilityErrorCode = "unknown",
): FacilityError {
  return { message, code };
}

async function requireProfile(): Promise<FacilityResult<ProfileRow>> {
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

export async function getFacilitySettings(): Promise<
  FacilityResult<FacilitySettings>
> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("facilities")
    .select("name, currency")
    .eq("id", profileResult.data.facility_id)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Facility not found") };
  }

  const row = data as Pick<FacilityRow, "name" | "currency">;
  return {
    data: {
      name: row.name,
      currency: row.currency ?? "EUR",
    },
    error: null,
  };
}

export async function updateFacilitySettings(
  name: string,
  currency: string,
): Promise<FacilityResult<FacilitySettings>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("facilities")
    .update({
      name: name.trim() || null,
      currency,
    })
    .eq("id", profileResult.data.facility_id)
    .select("name, currency")
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Facility not found") };
  }

  const row = data as Pick<FacilityRow, "name" | "currency">;
  return {
    data: {
      name: row.name,
      currency: row.currency ?? "EUR",
    },
    error: null,
  };
}
