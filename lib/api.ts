import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getStaffAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function staffFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const accessToken = await getStaffAccessToken();
  if (!accessToken) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(path, { ...init, headers });
}
