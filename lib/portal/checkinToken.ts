import { portalFetch } from "@/lib/portal/api";

export interface CheckinTokenSuccessResponse {
  ok: true;
  token: string;
  expiresAt: string;
}

export interface CheckinTokenErrorResponse {
  ok: false;
  error: string;
}

export type CheckinTokenResponse =
  | CheckinTokenSuccessResponse
  | CheckinTokenErrorResponse;

export async function requestCheckinToken(
  bookingId: string,
): Promise<CheckinTokenSuccessResponse> {
  const response = await portalFetch("/api/portal/checkin-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId }),
  });

  const data = (await response.json()) as CheckinTokenResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to generate check-in code";
    throw new Error(message);
  }

  return data;
}

export function formatCheckinTokenForDisplay(token: string): string {
  const normalized = token.replace(/-/g, "");
  return normalized.match(/.{1,4}/g)?.join("-") ?? token;
}

export function normalizeCheckinTokenInput(input: string): string {
  return input.trim().replace(/-/g, "");
}

export function isBookingCheckInAvailableToday(
  status: string,
  startDate: string,
  endDate: string,
): boolean {
  if (status !== "approved") return false;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;

  return startDate <= today && endDate >= today;
}

export function getCheckInUnavailableMessage(
  status: string,
  startDate: string,
  endDate: string,
): string {
  if (status !== "approved") {
    return "Check-in opens once your booking is approved.";
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;

  if (today < startDate) {
    return "This booking is for a future date. Check-in opens on the day of your stay.";
  }

  if (today > endDate) {
    return "This booking is for a past date.";
  }

  return "Check-in is not available for this booking right now.";
}
