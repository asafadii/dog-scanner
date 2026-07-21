import type { createSupabaseAdminClient } from "@/lib/supabase/server";

type ServerDb = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const IP_ATTEMPT_LIMIT = 5;
const RATE_LIMIT_MESSAGE = "Too many attempts. Please try again later.";

function rateLimitWindowStart(): string {
  return new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
}

export async function checkEmbedRateLimit(
  db: ServerDb,
  ipAddress: string,
): Promise<{ allowed: boolean; error?: string }> {
  if (ipAddress === "unknown") {
    return { allowed: true };
  }

  const { count, error } = await db
    .from("embed_booking_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .gt("attempted_at", rateLimitWindowStart());

  if (error) {
    console.error("[embed rate limit] check failed:", error.message);
    return { allowed: true };
  }

  if ((count ?? 0) >= IP_ATTEMPT_LIMIT) {
    return { allowed: false, error: RATE_LIMIT_MESSAGE };
  }

  return { allowed: true };
}

export async function recordEmbedAttempt(
  db: ServerDb,
  ipAddress: string,
  facilityId: string | null,
  succeeded: boolean,
): Promise<void> {
  try {
    const { error } = await db.from("embed_booking_attempts").insert({
      ip_address: ipAddress,
      facility_id: facilityId,
      succeeded,
    });

    if (error) {
      console.error("[embed rate limit] record failed:", error.message);
    }
  } catch (err) {
    console.error(
      "[embed rate limit] record failed:",
      err instanceof Error ? err.message : err,
    );
  }
}
