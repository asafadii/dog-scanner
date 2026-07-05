import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface SendClientInviteSuccessResponse {
  ok: true;
}

export interface SendClientInviteErrorResponse {
  ok: false;
  error: string;
}

export type SendClientInviteResponse =
  | SendClientInviteSuccessResponse
  | SendClientInviteErrorResponse;

export async function sendClientInvite(
  clientId: string,
): Promise<SendClientInviteResponse> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    return { ok: false, error: "Not signed in" };
  }

  const response = await fetch("/api/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ clientId }),
  });

  const data = (await response.json()) as SendClientInviteResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data ? data.error : "Failed to send invite";
    return { ok: false, error: message };
  }

  return data;
}
