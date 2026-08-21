"use client";

import { Button } from "@/components/ui/Button";
import {
  calculateStayPrice,
  recordPayment,
  type StayPriceResult,
} from "@/lib/pricing";
import { formatAmount } from "@/lib/currency";
import { getFacilitySettings } from "@/lib/facility";
import { getApplicablePasses } from "@/lib/passes";
import type { ClientPassListItem, Payment, PaymentMethod } from "@/lib/types";
import { cn, formatBookingDate } from "@/lib/utils";
import { Banknote, CreditCard, Landmark, Loader2, Ticket, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [foodPrefilled, setFoodPrefilled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState("EUR");
  const [applicablePasses, setApplicablePasses] = useState<
    ClientPassListItem[]
  >([]);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const didPrefillFood = useRef(false);

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
      if (
        !didPrefillFood.current &&
        result.data.bookingFoodSource === "facility"
      ) {
        didPrefillFood.current = true;
        setFoodAddon(true);
        setFoodPrefilled(true);
      } else {
        didPrefillFood.current = true;
      }
    }

    setLoading(false);
  }, [checkinId, foodAddon]);

  useEffect(() => {
    void loadPrice();
  }, [loadPrice]);

  useEffect(() => {
    if (!breakdown?.clientId) {
      setApplicablePasses([]);
      setSelectedPassId(null);
      return;
    }

    const clientId = breakdown.clientId;
    const serviceType = breakdown.serviceType;

    void getApplicablePasses(clientId, serviceType).then((result) => {
      if (result.error) {
        setApplicablePasses([]);
        return;
      }
      setApplicablePasses(result.data);
    });
  }, [breakdown?.clientId, breakdown?.serviceType]);

  useEffect(() => {
    if (paymentMethod !== "pass") return;
    if (applicablePasses.length === 0) {
      setSelectedPassId(null);
      return;
    }
    setSelectedPassId((current) =>
      current && applicablePasses.some((pass) => pass.id === current)
        ? current
        : applicablePasses[0].id,
    );
  }, [paymentMethod, applicablePasses]);

  async function handleSubmit() {
    if (!paymentMethod) return;
    if (paymentMethod === "pass" && !selectedPassId) return;

    setSubmitting(true);
    setError(null);

    const result = await recordPayment(checkinId, {
      paymentMethod,
      foodAddon: foodAddon || undefined,
      clientPassId:
        paymentMethod === "pass" ? selectedPassId ?? undefined : undefined,
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
    foodAddon &&
    foodPrefilled &&
    breakdown?.bookingFoodSource === "facility";

  const selectedPass =
    applicablePasses.find((pass) => pass.id === selectedPassId) ?? null;
  const showPassOption = applicablePasses.length > 0;
  const lastUseOnSelectedPass =
    selectedPass !== null &&
    selectedPass.occasionsUsed + 1 === selectedPass.occasionsTotal;

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
                  Pre-filled from this visit&apos;s food source. Uncheck to
                  override.
                </p>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Payment method
            </p>
            <div
              className={cn(
                "grid gap-2",
                showPassOption ? "grid-cols-4" : "grid-cols-3",
              )}
            >
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
              {showPassOption && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pass")}
                  disabled={submitting}
                  className={cn(
                    "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
                    paymentMethod === "pass"
                      ? "border-primary bg-mint-wash text-primary"
                      : "border-border bg-surface text-foreground hover:border-primary/40",
                  )}
                  aria-pressed={paymentMethod === "pass"}
                >
                  <Ticket className="h-4 w-4" aria-hidden />
                  Pass
                </button>
              )}
            </div>

            {paymentMethod === "pass" && selectedPass && (
              <div className="mt-3 space-y-2">
                {applicablePasses.length === 1 ? (
                  <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground">
                    {selectedPass.passTypeName}
                    {" · "}
                    {selectedPass.occasionsTotal - selectedPass.occasionsUsed} of{" "}
                    {selectedPass.occasionsTotal} remaining
                    {" · "}
                    Expires {formatBookingDate(selectedPass.expiryDate)}
                  </div>
                ) : (
                  <div
                    className="space-y-2 rounded-xl border border-border bg-surface p-3"
                    role="radiogroup"
                    aria-label="Select a pass"
                  >
                    {applicablePasses.map((pass) => {
                      const remaining = pass.occasionsTotal - pass.occasionsUsed;
                      return (
                        <label
                          key={pass.id}
                          className={cn(
                            "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm",
                            selectedPassId === pass.id
                              ? "border-primary bg-mint-wash"
                              : "border-border bg-surface",
                          )}
                        >
                          <input
                            type="radio"
                            name="checkout-pass"
                            checked={selectedPassId === pass.id}
                            onChange={() => setSelectedPassId(pass.id)}
                            disabled={submitting}
                            className="mt-1 h-4 w-4 border-border text-primary focus:ring-primary"
                          />
                          <span>
                            <span className="block font-medium text-foreground">
                              {pass.passTypeName}
                            </span>
                            <span className="mt-0.5 block text-muted-foreground">
                              {remaining} of {pass.occasionsTotal} remaining
                              {" · "}
                              Expires {formatBookingDate(pass.expiryDate)}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {lastUseOnSelectedPass && (
                  <p className="px-1 text-xs text-muted-foreground">
                    This is the last use on this pass.
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            variant="danger"
            className="w-full"
            onClick={() => void handleSubmit()}
            disabled={
              submitting ||
              !paymentMethod ||
              (paymentMethod === "pass" && !selectedPassId)
            }
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
