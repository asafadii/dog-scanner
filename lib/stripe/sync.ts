import "server-only";

import type { FacilityRow } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { STRIPE_PRICES } from "@/lib/stripe/server";

export type FacilitySubscriptionPlan = FacilityRow["subscription_plan"];
export type FacilitySubscriptionStatus = FacilityRow["subscription_status"];

export function planFromPriceId(
  priceId: string,
): FacilitySubscriptionPlan | null {
  if (priceId === STRIPE_PRICES.dora) return "dora";
  if (priceId === STRIPE_PRICES.dora_unlimited) return "dora_unlimited";
  return null;
}

export function planFromSubscription(
  subscription: Stripe.Subscription,
): FacilitySubscriptionPlan | null {
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return null;
  return planFromPriceId(priceId);
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): FacilitySubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "past_due";
  }
}

export function staffLimitForPlan(plan: FacilitySubscriptionPlan): number {
  return plan === "dora_unlimited" ? 999 : 3;
}

export function facilityUpdateFromSubscription(
  subscription: Stripe.Subscription,
): Partial<FacilityRow> | null {
  const plan = planFromSubscription(subscription);
  if (!plan) return null;

  return {
    subscription_status: mapStripeSubscriptionStatus(subscription.status),
    subscription_plan: plan,
    subscription_started_at: new Date(
      subscription.start_date * 1000,
    ).toISOString(),
    stripe_subscription_id: subscription.id,
    staff_limit: staffLimitForPlan(plan),
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  };
}

export async function updateFacilityByStripeCustomerId(
  db: SupabaseClient,
  stripeCustomerId: string,
  update: Partial<FacilityRow>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await db
    .from("facilities")
    .update(update)
    .eq("stripe_customer_id", stripeCustomerId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
