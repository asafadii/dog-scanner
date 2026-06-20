export interface ClaimAccountRequest {
  inviteCode: string;
}

export interface ClaimAccountSuccessResponse {
  ok: true;
  alreadyLinked?: boolean;
  clientId: string;
  facilityId: string;
}

export interface ClaimAccountErrorResponse {
  ok: false;
  error: string;
}

export type ClaimAccountResponse =
  | ClaimAccountSuccessResponse
  | ClaimAccountErrorResponse;

export async function claimClientAccount(
  accessToken: string,
  inviteCode: string,
): Promise<ClaimAccountResponse> {
  const response = await fetch("/api/portal/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ inviteCode: inviteCode.trim() }),
  });

  const data = (await response.json()) as ClaimAccountResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to link your account";
    throw new Error(message);
  }

  return data;
}
