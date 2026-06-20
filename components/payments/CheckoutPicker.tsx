"use client";

import { Button } from "@/components/ui/Button";
import {
  calculateStayPrice,
  recordPayment,
  type StayPriceResult,
} from "@/lib/pricing";
import type { Payment, PaymentMethod } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
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
  onComplete,
  onClose,
  className,
}: CheckoutPickerProps) {
  const [breakdown, setBreakdown] = useState<StayPriceResult | null>(null);
  const [foodAddon, setFoodAddon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const showFoodCheckbox =
    breakdown &&
    breakdown.serviceType === "daycare" &&
    !breakdown.foodAddonOnBooking;

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200 bg-stone-50 p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-stone-900">Check Out & Pay</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/70"
          aria-label="Close checkout"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Calculating price...
        </div>
      ) : breakdown ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-stone-600">
                {breakdown.serviceType === "daycare" ? "Daycare" : "Boarding"}{" "}
                rate × {breakdown.units}{" "}
                {unitLabel(breakdown.serviceType, breakdown.units)}
              </span>
              <span className="font-medium tabular-nums text-stone-900">
                {formatCurrency(breakdown.rate * breakdown.units)}
              </span>
            </div>
            {breakdown.transportFee > 0 && (
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-stone-600">Transport</span>
                <span className="font-medium tabular-nums text-stone-900">
                  {formatCurrency(breakdown.transportFee)}
                </span>
              </div>
            )}
            {breakdown.foodFee > 0 && (
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-stone-600">Food add-on</span>
                <span className="font-medium tabular-nums text-stone-900">
                  {formatCurrency(breakdown.foodFee)}
                </span>
              </div>
            )}
            {breakdown.surchargePercent > 0 && (
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-stone-600">
                  Seasonal surcharge ({breakdown.surchargePercent}%)
                </span>
                <span className="font-medium tabular-nums text-stone-900">
                  {formatCurrency(breakdown.total - breakdown.subtotal)}
                </span>
              </div>
            )}
            <div className="mt-3 flex justify-between gap-3 border-t border-stone-100 pt-3 font-semibold text-stone-900">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(breakdown.total)}</span>
            </div>
          </div>

          {showFoodCheckbox && (
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={foodAddon}
                onChange={(e) => setFoodAddon(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-stone-800">
                Add daycare food (+{formatCurrency(breakdown.configuredFoodFee)})
              </span>
            </label>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-stone-700">
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
                      ? "border-teal-600 bg-teal-50 text-teal-800"
                      : "border-stone-200 bg-white text-stone-700 hover:border-teal-200",
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
