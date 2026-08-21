import type { FacilityError } from "@/lib/facility";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FacilityAccessLevel = "full" | "grace" | "blocked";

export interface FacilityAccessInfo {
  level: FacilityAccessLevel;
  /** Only set when level === "grace" */
  daysUntilBlocked: number | null;
}

/** Server/admin or authenticated server client already held by the caller. */
export type ServerDb = SupabaseClient;

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const GRACE_DAYS = 7;

const FULL_ACCESS: FacilityAccessInfo = {
  level: "full",
  daysUntilBlocked: null,
};

const BLOCKED_ACCESS: FacilityAccessInfo = {
  level: "blocked",
  daysUntilBlocked: null,
};

function toFacilityError(message: string): FacilityError {
  return { message, code: "unknown" };
}

export function computeFacilityAccessLevel(
  subscriptionStatus: string,
  pastDueSince: string | null,
  trialEndsAt: string | null,
  stripeSubscriptionId: string | null,
): FacilityAccessInfo {
  if (subscriptionStatus === "trialing") {
    // Abandoned checkout: trial clock ran out and Stripe never created a subscription.
    // trial_ends_at null is treated as current behavior (do not guess / do not block).
    if (
      !stripeSubscriptionId &&
      trialEndsAt &&
      Date.now() - new Date(trialEndsAt).getTime() >= 0
    ) {
      return BLOCKED_ACCESS;
    }
    return FULL_ACCESS;
  }

  if (subscriptionStatus === "active") {
    return FULL_ACCESS;
  }

  if (subscriptionStatus === "canceled") {
    return BLOCKED_ACCESS;
  }

  if (subscriptionStatus === "past_due") {
    if (!pastDueSince) {
      // Defensive: webhook should always set past_due_since
      return FULL_ACCESS;
    }

    const daysSincePastDue =
      (Date.now() - new Date(pastDueSince).getTime()) / MS_PER_DAY;

    if (daysSincePastDue >= GRACE_DAYS) {
      return BLOCKED_ACCESS;
    }

    return {
      level: "grace",
      daysUntilBlocked: Math.ceil(GRACE_DAYS - daysSincePastDue),
    };
  }

  return FULL_ACCESS;
}

export async function getFacilityAccessLevel(
  facilityId: string,
): Promise<{ data: FacilityAccessInfo | null; error: FacilityError | null }> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("facilities")
      .select(
        "subscription_status, past_due_since, trial_ends_at, stripe_subscription_id",
      )
      .eq("id", facilityId)
      .maybeSingle();

    if (error) {
      return { data: null, error: toFacilityError(error.message) };
    }

    if (!data) {
      return { data: null, error: toFacilityError("Facility not found") };
    }

    const row = data as {
      subscription_status: string;
      past_due_since: string | null;
      trial_ends_at: string | null;
      stripe_subscription_id: string | null;
    };

    return {
      data: computeFacilityAccessLevel(
        row.subscription_status,
        row.past_due_since,
        row.trial_ends_at,
        row.stripe_subscription_id,
      ),
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load facility access";
    return { data: null, error: toFacilityError(message) };
  }
}

/**
 * Fail-open on fetch errors — RLS is the hard backstop for writes.
 * An API-layer hiccup should not itself lock someone out.
 */
export async function getFacilityAccessLevelServer(
  db: ServerDb,
  facilityId: string,
): Promise<FacilityAccessInfo> {
  try {
    const { data, error } = await db
      .from("facilities")
      .select(
        "subscription_status, past_due_since, trial_ends_at, stripe_subscription_id",
      )
      .eq("id", facilityId)
      .maybeSingle();

    if (error || !data) {
      return FULL_ACCESS;
    }

    const row = data as {
      subscription_status: string;
      past_due_since: string | null;
      trial_ends_at: string | null;
      stripe_subscription_id: string | null;
    };

    return computeFacilityAccessLevel(
      row.subscription_status,
      row.past_due_since,
      row.trial_ends_at,
      row.stripe_subscription_id,
    );
  } catch {
    return FULL_ACCESS;
  }
}
