import "server-only";

import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
} from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

export interface StaffAuthSuccess {
  user: User;
  profile: ProfileRow;
  db: NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
}

export type StaffAuthResult =
  | { ok: true; data: StaffAuthSuccess }
  | { ok: false; error: string; status: number };

export async function verifyStaffAccessToken(
  request: Request,
): Promise<StaffAuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      error: "Missing authorization token",
      status: 401,
    };
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    return {
      ok: false,
      error: "Missing authorization token",
      status: 401,
    };
  }

  const authClient = createSupabaseAnonClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      ok: false,
      error: "Invalid or expired session",
      status: 401,
    };
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return {
      ok: false,
      error: "Server configuration error",
      status: 500,
    };
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      error: profileError.message,
      status: 500,
    };
  }

  if (!profile) {
    return {
      ok: false,
      error: "Staff profile not found",
      status: 403,
    };
  }

  return {
    ok: true,
    data: { user, profile: profile as ProfileRow, db },
  };
}
