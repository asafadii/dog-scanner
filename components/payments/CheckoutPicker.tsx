"use client";

import { Button } from "@/components/ui/Button";
import {
  calculateStayPrice,
  recordPayment,
  type StayPriceResult,
} from "@/lib/pricing";
import { formatAmount } from "@/lib/currency";
import { getFacilitySettings } from "@/lib/facility";
import type { FeedingSource, Payment, PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Banknote, CreditCard, Landmark, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "transfer", label: "Transfer", icon: Landmark },
];

interface CheckoutPickerProps {
  checkinId: string;
  feedingSource?: FeedingSource | null;
  onComplete: (payment: Payment) => void;
  onClose: () => void;
  className?: string;
}

function unitLabel(serviceType: StayPriceResult["serviceType"], units: number) {
  if (serviceType === "boarding") {
    return units === 1 ? "night" : "nights";
  }
  return units === 1 ? "day" : "days";
}

export function CheckoutPicker({
  checkinId,
  feedingSource = null,
  onComplete,
  onClose,
  className,
}: CheckoutPickerProps) {
  const [breakdown, setBreakdown] = useState<StayPriceResult | null>(null);
  const [foodAddon, setFoodAddon] = useState(false);
  const [foodPrefilled, setFoodPrefilled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState("EUR");

  useEffect(() => {
    if (feedingSource === "facility") {
      setFoodAddon(true);
      setFoodPrefilled(true);
    }
  }, [feedingSource]);

  useEffect(() => {
    void (async () => {
      const result = await getFacilitySettings();
      if (!result.error) {
        setCurrency(result.data.currency);
      }
    })();
  }, []);

  const formatPrice = (value: number) => formatAmount(value, currency);

  const loadPrice = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await calculateStayPrice(checkinId, { foodAddon });
    if (result.error) {
      setError(result.error.message);
      setBreakdown(null);
    } else {
      setBreakdown(result.data);
    }

    setLoading(false);
  }, [checkinId, foodAddon]);

  useEffect(() => {
    void loadPrice();
  }, [loadPrice]);

  async function handleSubmit() {
    if (!paymentMethod) return;

    setSubmitting(true);
    setError(null);

    const result = await recordPayment(checkinId, {
      paymentMethod,
      foodAddon: foodAddon || undefined,
    });

    if (result.error) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    onComplete(result.data);
    onClose();
    setSubmitting(false);
  }

  function handleFoodAddonChange(checked: boolean) {
    setFoodAddon(checked);
    setFoodPrefilled(false);
  }

  const showFoodCheckbox =
    breakdown &&
    breakdown.serviceType === "daycare" &&
    !breakdown.foodAddonOnBooking;

  const showFoodPrefillHint =
    foodAddon && feedingSource === "facility" && foodPrefilled;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Check Out & Pay</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Close checkout"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        // #FEF2F2 = documented Alert error tint (Alert.tsx precedent, D-04)
        <div
          className="mb-3 rounded-lg border border-danger/25 bg-[#FEF2F2] px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Calculating price...
        </div>
      ) : breakdown ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                {breakdown.serviceType === "daycare" ? "Daycare" : "Boarding"}{" "}
                rate × {breakdown.units}{" "}
                {unitLabel(breakdown.serviceType, breakdown.units)}
              </span>
              <span className="font-medium tabular-nums text-foreground">
                {formatPrice(breakdown.rate * breakdown.units)}
              </span>
            </div>
            {breakdown.transportFee > 0 && (
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-muted-foreground">Transport</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatPrice(breakdown.transportFee)}
                </span>
              </div>
            )}
            {breakdown.foodFee > 0 && (
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-muted-foreground">Food add-on</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatPrice(breakdown.foodFee)}
                </span>
              </div>
            )}
            {breakdown.surchargePercent > 0 && (
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-muted-foreground">
                  Seasonal surcharge ({breakdown.surchargePercent}%)
                </span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatPrice(breakdown.total - breakdown.subtotal)}
                </span>
              </div>
            )}
            <div className="mt-3 flex justify-between gap-3 border-t border-border pt-3 font-semibold text-foreground">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(breakdown.total)}</span>
            </div>
          </div>

          {showFoodCheckbox && (
            <div className="space-y-1">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={foodAddon}
                  onChange={(e) => handleFoodAddonChange(e.target.checked)}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-foreground">
                  Add daycare food (+{formatPrice(breakdown.configuredFoodFee)})
                </span>
              </label>
              {showFoodPrefillHint && (
                <p className="px-1 text-xs text-muted-foreground">
                  Pre-filled from dog&apos;s feeding preference. Uncheck to
                  override.
                </p>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Payment method
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  disabled={submitting}
                  className={cn(
                    "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
                    paymentMethod === value
                      ? "border-primary bg-mint-wash text-primary"
                      : "border-border bg-surface text-foreground hover:border-primary/40",
                  )}
                  aria-pressed={paymentMethod === value}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="danger"
            className="w-full"
            onClick={() => void handleSubmit()}
            disabled={submitting || !paymentMethod}
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            {submitting ? "Processing..." : "Confirm Check Out"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
