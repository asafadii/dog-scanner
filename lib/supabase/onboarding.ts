import "server-only";

import type { FacilityRow, ProfileRow, UserRole } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function findProfileByUserId(
  db: SupabaseClient,
  userId: string,
): Promise<{ data: ProfileRow | null; error: Error | null }> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return {
    data: data as ProfileRow | null,
    error: error ? new Error(error.message) : null,
  };
}

export async function findFacilityById(
  db: SupabaseClient,
  facilityId: string,
): Promise<{ data: FacilityRow | null; error: Error | null }> {
  const { data, error } = await db
    .from("facilities")
    .select("*")
    .eq("id", facilityId)
    .maybeSingle();

  return {
    data: data as FacilityRow | null,
    error: error ? new Error(error.message) : null,
  };
}

export async function createFacility(
  db: SupabaseClient,
  name: string,
): Promise<{ data: FacilityRow | null; error: Error | null }> {
  const { data, error } = await db
    .from("facilities")
    .insert({ name })
    .select("*")
    .single();

  return {
    data: data as FacilityRow | null,
    error: error ? new Error(error.message) : null,
  };
}

export async function countProfilesForFacility(
  db: SupabaseClient,
  facilityId: string,
): Promise<{ data: number; error: Error | null }> {
  const { count, error } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("facility_id", facilityId);

  return {
    data: count ?? 0,
    error: error ? new Error(error.message) : null,
  };
}

export async function createProfile(
  db: SupabaseClient,
  profile: {
    id: string;
    facility_id: string;
    full_name: string;
    email: string;
    role: UserRole;
  },
): Promise<{ data: ProfileRow | null; error: Error | null; code?: string }> {
  const { data, error } = await db
    .from("profiles")
    .insert(profile)
    .select("*")
    .single();

  return {
    data: data as ProfileRow | null,
    error: error ? new Error(error.message) : null,
    code: error?.code,
  };
}

export async function deleteFacility(
  db: SupabaseClient,
  facilityId: string,
): Promise<void> {
  await db.from("facilities").delete().eq("id", facilityId);
}
