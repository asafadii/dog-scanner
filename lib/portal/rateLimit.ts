import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const IP_FAILED_LIMIT = 10;
const USER_FAILED_LIMIT = 5;

export const RATE_LIMIT_MESSAGE = "Too many attempts. Please try again later.";

export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function rateLimitWindowStart(): string {
  return new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
}

export async function logClaimAttempt(
  db: SupabaseClient,
  ipAddress: string,
  userId: string | null,
  succeeded: boolean,
): Promise<void> {
  await db.from("claim_attempts").insert({
    ip_address: ipAddress,
    user_id: userId,
    succeeded,
  });
}

export async function isRateLimited(
  db: SupabaseClient,
  ipAddress: string,
  userId: string | null,
): Promise<boolean> {
  const windowStart = rateLimitWindowStart();

  if (ipAddress !== "unknown") {
    const { count: ipFailedCount, error: ipCountError } = await db
      .from("claim_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ipAddress)
      .eq("succeeded", false)
      .gt("attempted_at", windowStart);

    if (ipCountError) {
      throw new Error(ipCountError.message);
    }

    if ((ipFailedCount ?? 0) >= IP_FAILED_LIMIT) {
      return true;
    }
  }

  if (!userId) {
    return false;
  }

  const { count: userFailedCount, error: userCountError } = await db
    .from("claim_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("succeeded", false)
    .gt("attempted_at", windowStart);

  if (userCountError) {
    throw new Error(userCountError.message);
  }

  return (userFailedCount ?? 0) >= USER_FAILED_LIMIT;
}
