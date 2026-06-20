import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizeCheckinTokenInput } from "@/lib/portal/checkinToken";

export interface ResolveCheckinTokenSuccessResponse {
  ok: true;
  dogId: string;
  bookingId: string;
}

export interface ResolveCheckinTokenErrorResponse {
  ok: false;
  error: string;
}

export type ResolveCheckinTokenResponse =
  | ResolveCheckinTokenSuccessResponse
  | ResolveCheckinTokenErrorResponse;

export async function resolveCheckinToken(
  token: string,
): Promise<ResolveCheckinTokenSuccessResponse> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("Not signed in");
  }

  const response = await fetch("/api/checkin/resolve-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token: normalizeCheckinTokenInput(token) }),
  });

  const data = (await response.json()) as ResolveCheckinTokenResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to resolve check-in code";
    throw new Error(message);
  }

  return data;
}
