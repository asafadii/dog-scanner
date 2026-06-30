import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FacilityRow, ProfileRow } from "@/lib/supabase/types";
import type { StaffMember, SubscriptionInfo } from "@/lib/types";

export type SubscriptionErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "unknown";

export interface SubscriptionError {
  message: string;
  code: SubscriptionErrorCode;
}

type SubscriptionResult<T> =
  | { data: T; error: null }
  | { data: null; error: SubscriptionError };

function toError(
  message: string,
  code: SubscriptionErrorCode = "unknown",
): SubscriptionError {
  return { message, code };
}

function mapFacilityToSubscriptionInfo(row: FacilityRow): SubscriptionInfo {
  const isActive =
    row.subscription_status === "trialing" ||
    row.subscription_status === "active";

  let daysLeftInTrial: number | null = null;
  if (row.subscription_status === "trialing" && row.trial_ends_at) {
    const msLeft =
      new Date(row.trial_ends_at).getTime() - Date.now();
    daysLeftInTrial = Math.max(
      0,
      Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
    );
  }

  return {
    plan: row.subscription_plan,
    status: row.subscription_status,
    trialEndsAt: row.trial_ends_at,
    staffLimit: row.staff_limit,
    isUnlimited: row.subscription_plan === "dora_unlimited",
    isActive,
    daysLeftInTrial,
  };
}

function mapProfileToStaffMember(row: ProfileRow): StaffMember {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function requireProfile(): Promise<SubscriptionResult<ProfileRow>> {
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

export async function getSubscriptionInfo(): Promise<
  SubscriptionResult<SubscriptionInfo>
> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", profileResult.data.facility_id)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Facility not found", "not_found") };
  }

  return {
    data: mapFacilityToSubscriptionInfo(data as FacilityRow),
    error: null,
  };
}

export async function getStaffCount(
  facilityId: string,
): Promise<SubscriptionResult<number>> {
  const supabase = createSupabaseBrowserClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("facility_id", facilityId);

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: count ?? 0, error: null };
}

export async function getFacilityStaff(): Promise<
  SubscriptionResult<StaffMember[]>
> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("facility_id", profileResult.data.facility_id)
    .order("full_name", { ascending: true });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: (data as ProfileRow[]).map(mapProfileToStaffMember),
    error: null,
  };
}

export function formatStaffLimit(staffLimit: number): string {
  if (staffLimit > 100) return "Unlimited";
  return String(staffLimit);
}
