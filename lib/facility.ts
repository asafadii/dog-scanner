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
  facilityCode: string | null;
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

const FACILITY_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const FACILITY_CODE_LENGTH = 6;

function toError(
  message: string,
  code: FacilityErrorCode = "unknown",
): FacilityError {
  return { message, code };
}

function generateFacilityCodeValue(): string {
  let code = "";
  for (let i = 0; i < FACILITY_CODE_LENGTH; i += 1) {
    code += FACILITY_CODE_CHARS[
      Math.floor(Math.random() * FACILITY_CODE_CHARS.length)
    ];
  }
  return code;
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

function mapFacilitySettings(
  row: Pick<FacilityRow, "name" | "currency" | "facility_code">,
): FacilitySettings {
  return {
    name: row.name,
    currency: row.currency ?? "EUR",
    facilityCode: row.facility_code ?? null,
  };
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
    .select("name, currency, facility_code")
    .eq("id", profileResult.data.facility_id)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Facility not found") };
  }

  return {
    data: mapFacilitySettings(
      data as Pick<FacilityRow, "name" | "currency" | "facility_code">,
    ),
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
    .select("name, currency, facility_code")
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Facility not found") };
  }

  return {
    data: mapFacilitySettings(
      data as Pick<FacilityRow, "name" | "currency" | "facility_code">,
    ),
    error: null,
  };
}

export async function generateFacilityCode(): Promise<
  FacilityResult<FacilitySettings>
> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const facilityId = profileResult.data.facility_id;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateFacilityCodeValue();

    const { data: taken } = await supabase
      .from("facilities")
      .select("id")
      .ilike("facility_code", code)
      .neq("id", facilityId)
      .maybeSingle();

    if (taken) {
      continue;
    }

    const { data, error } = await supabase
      .from("facilities")
      .update({ facility_code: code })
      .eq("id", facilityId)
      .select("name, currency, facility_code")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        continue;
      }
      return { data: null, error: toError(error.message) };
    }

    if (!data) {
      return { data: null, error: toError("Facility not found") };
    }

    return {
      data: mapFacilitySettings(
        data as Pick<FacilityRow, "name" | "currency" | "facility_code">,
      ),
      error: null,
    };
  }

  return {
    data: null,
    error: toError("Could not generate a unique facility code. Please try again."),
  };
}
