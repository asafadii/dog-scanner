import "server-only";

import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
} from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface PortalAuthSuccess {
  user: User;
  db: NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
}

export type PortalAuthResult =
  | { ok: true; data: PortalAuthSuccess }
  | { ok: false; error: string; status: number };

export async function verifyPortalAccessToken(
  request: Request,
): Promise<PortalAuthResult> {
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

  return { ok: true, data: { user, db } };
}

export async function verifyClientAccountLink(
  db: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  userId: string,
  clientId: string,
  facilityId: string,
): Promise<boolean> {
  const { data } = await db
    .from("client_account_links")
    .select("id")
    .eq("client_account_id", userId)
    .eq("client_id", clientId)
    .eq("facility_id", facilityId)
    .maybeSingle();

  return Boolean(data);
}

export async function verifyDogLinkedToClientAccount(
  db: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  userId: string,
  dogId: string,
): Promise<
  | { ok: true; dog: { id: string; client_id: string; facility_id: string } }
  | { ok: false; error: string; status: number }
> {
  const { data: dog, error: dogError } = await db
    .from("dogs")
    .select("id, client_id, facility_id")
    .eq("id", dogId)
    .maybeSingle();

  if (dogError) {
    return { ok: false, error: dogError.message, status: 500 };
  }

  if (!dog?.client_id) {
    return { ok: false, error: "Dog not found", status: 404 };
  }

  const linked = await verifyClientAccountLink(
    db,
    userId,
    dog.client_id,
    dog.facility_id,
  );

  if (!linked) {
    return { ok: false, error: "Not authorized", status: 403 };
  }

  return { ok: true, dog };
}
