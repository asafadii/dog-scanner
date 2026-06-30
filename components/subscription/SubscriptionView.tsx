"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  formatStaffLimit,
  getSubscriptionInfo,
} from "@/lib/subscription";
import type { SubscriptionInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, CreditCard, Loader2 } from "lucide-react";
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
      className: "bg-amber-50 text-amber-800 border-amber-200",
    },
    active: {
      label: "Active",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    past_due: {
      label: "Past due",
      className: "bg-red-50 text-red-800 border-red-200",
    },
    canceled: {
      label: "Canceled",
      className: "bg-stone-100 text-stone-600 border-stone-200",
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
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-stone-100" />
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="h-6 w-32 animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-stone-100" />
            <div className="h-10 w-40 animate-pulse rounded-xl bg-stone-100" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-red-800" role="alert">
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
      : `Up to ${subscription.staffLimit} staff members`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Subscription
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Your plan, billing status, and upgrade options.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <CreditCard
              className="h-5 w-5 text-[oklch(0.531_0.092_185.0)]"
              aria-hidden
            />
            Current plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xl font-bold text-stone-900">
              {planDisplayName(subscription.plan)}
            </p>
            <StatusBadge status={subscription.status} />
          </div>

          {subscription.status === "trialing" &&
            subscription.daysLeftInTrial !== null && (
              <p className="text-sm text-amber-800">
                {subscription.daysLeftInTrial} day
                {subscription.daysLeftInTrial !== 1 ? "s" : ""} left in your
                trial
              </p>
            )}

          <p className="text-sm text-stone-600">{staffLimitLabel}</p>

          <Button disabled className="w-full sm:w-auto">
            Manage Billing — Coming soon (Stripe integration in next update)
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-stone-900">
          Compare plans
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {PLAN_CARDS.map((plan) => {
            const isCurrent = subscription.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl border-2 p-6",
                  isCurrent
                    ? "border-[oklch(0.531_0.092_185.0)] bg-[#F0FAF9]"
                    : "border-stone-200 bg-white",
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-4 rounded-full bg-[oklch(0.531_0.092_185.0)] px-3 py-1 text-xs font-semibold text-white">
                    Current plan
                  </span>
                )}
                <h4 className="text-lg font-bold text-stone-900">{plan.name}</h4>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-[oklch(0.531_0.092_185.0)]">
                    {plan.price}
                  </span>
                  <span className="text-sm text-stone-500">{plan.period}</span>
                </p>
                <p className="mt-2 text-sm text-stone-600">{plan.description}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-stone-600"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.531_0.092_185.0)]"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
