"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { staffFetch } from "@/lib/api";
import {
  formatStaffLimit,
  getSubscriptionInfo,
} from "@/lib/subscription";
import type { SubscriptionInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const PLAN_CARDS = [
  {
    id: "dora" as const,
    name: "DORA",
    price: "€49",
    period: "/month",
    description: "Everything you need to run your dog daycare.",
    features: [
      "Unlimited dogs",
      "Unlimited bookings",
      "Boarding & daycare management",
      "QR check-ins",
      "Kennel management",
      "Payments & reports",
      "Up to 3 staff members",
    ],
  },
  {
    id: "dora_unlimited" as const,
    name: "DORA Unlimited",
    price: "€99",
    period: "/month",
    description: "Built for growing operations.",
    features: [
      "Everything in DORA",
      "Unlimited staff",
      "Advanced reporting",
      "Priority support",
      "Future premium features included",
    ],
  },
];

function StatusBadge({ status }: { status: SubscriptionInfo["status"] }) {
  const config = {
    trialing: {
      label: "Trial",
      className: "bg-warning/10 text-warning border-warning/25",
    },
    active: {
      label: "Active",
      className: "bg-[#ECFDF5] text-success border-success/25",
    },
    past_due: {
      label: "Past due",
      className: "bg-[#FEF2F2] text-danger border-danger/25",
    },
    canceled: {
      label: "Canceled",
      className: "bg-muted text-muted-foreground border-border",
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function planDisplayName(plan: SubscriptionInfo["plan"]): string {
  return plan === "dora_unlimited" ? "DORA Unlimited" : "DORA";
}

export function SubscriptionView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<
    SubscriptionInfo["plan"] | null
  >(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getSubscriptionInfo();
    if (result.error) {
      setError(result.error.message);
      setSubscription(null);
    } else {
      setSubscription(result.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  useEffect(() => {
    if (searchParams.get("success") !== "true") return;

    setShowSuccessBanner(true);
    router.replace("/subscription");

    const timer = window.setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [searchParams, router]);

  async function handleManageBilling() {
    setPortalLoading(true);
    setActionError(null);

    try {
      const response = await staffFetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setActionError(data.error ?? "Failed to open billing portal");
        setPortalLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to open billing portal",
      );
      setPortalLoading(false);
    }
  }

  async function handleCheckout(plan: SubscriptionInfo["plan"]) {
    setCheckoutPlan(plan);
    setActionError(null);

    try {
      const response = await staffFetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setActionError(data.error ?? "Failed to start checkout");
        setCheckoutPlan(null);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to start checkout",
      );
      setCheckoutPlan(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-40 animate-pulse rounded-xl bg-muted" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="rounded-2xl border border-danger/25 bg-[#FEF2F2] px-6 py-12 text-center">
        {/* #FEF2F2 documented error-tint (D-04, mirrors Alert.tsx) */}
        <p className="text-sm font-medium text-danger" role="alert">
          {error ?? "Unable to load subscription details."}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void loadSubscription()}
        >
          Try again
        </Button>
      </div>
    );
  }

  const staffLimitLabel =
    subscription.staffLimit > 100
      ? "Unlimited"
      : `Up to ${formatStaffLimit(subscription.staffLimit)} staff members`;

  const showPlanButtons = subscription.status !== "active";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-foreground">
          Subscription
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your plan, billing status, and upgrade options.
        </p>
      </div>

      {showSuccessBanner && (
        <div
          className="rounded-xl border border-success/25 bg-[#ECFDF5] px-4 py-3 text-sm font-medium text-success"
          role="status"
        >
          {/* #ECFDF5 documented success-tint (D-04, mirrors Alert.tsx) */}
          Your subscription is active. Welcome to DORA!
        </div>
      )}

      {actionError && (
        <div
          className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {/* #FEF2F2 documented error-tint (D-04, mirrors Alert.tsx) */}
          {actionError}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <CreditCard
              className="h-5 w-5 text-primary"
              aria-hidden
            />
            Current plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xl font-bold text-foreground">
              {planDisplayName(subscription.plan)}
            </p>
            <StatusBadge status={subscription.status} />
          </div>

          {subscription.status === "trialing" &&
            subscription.daysLeftInTrial !== null && (
              <p className="text-sm text-warning">
                {subscription.daysLeftInTrial} day
                {subscription.daysLeftInTrial !== 1 ? "s" : ""} left in your
                trial
              </p>
            )}

          <p className="text-sm text-muted-foreground">{staffLimitLabel}</p>

          <Button
            className="w-full sm:w-auto"
            onClick={() => void handleManageBilling()}
            disabled={portalLoading}
          >
            {portalLoading && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            {portalLoading ? "Opening billing..." : "Manage Billing"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Compare plans
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {PLAN_CARDS.map((plan) => {
            const isCurrent = subscription.plan === plan.id;
            const isCheckingOut = checkoutPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl border-2 p-6",
                  isCurrent
                    ? "border-primary bg-mint-wash" // #EAF4F1 documented mint-wash (D-04)
                    : "border-border bg-surface",
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    Current plan
                  </span>
                )}
                <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {showPlanButtons && (
                  <Button
                    className="mt-5 w-full"
                    onClick={() => void handleCheckout(plan.id)}
                    disabled={checkoutPlan !== null}
                  >
                    {isCheckingOut && (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    )}
                    {isCheckingOut
                      ? "Redirecting..."
                      : `Start with ${plan.name}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
