import type { AuthSetupRequest, AuthSetupResponse } from "@/lib/supabase/types";

export async function runAuthSetup(
  accessToken: string,
  payload: AuthSetupRequest = {},
): Promise<AuthSetupResponse> {
  const response = await fetch("/api/auth/setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as AuthSetupResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to complete account setup";
    throw new Error(message);
  }

  return data;
}
