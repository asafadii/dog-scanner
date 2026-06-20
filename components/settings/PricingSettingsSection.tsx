"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  getPricingRules,
  INCOMPLETE_SETUP_MESSAGE,
  updatePricingRules,
} from "@/lib/pricing";
import type { PricingRules } from "@/lib/types";
import { Euro, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type PricingFormState = Omit<
  PricingRules,
  "facilityId" | "createdAt" | "updatedAt"
>;

export function PricingSettingsSection() {
  const [form, setForm] = useState<PricingFormState>({
    daycareRate: 25,
    boardingRate: 40,
    transportFee: 10,
    foodFee: 5,
    seasonalSurchargeEnabled: false,
    seasonalSurchargePercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPricing = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getPricingRules();
    if (result.error) {
      setError(result.error.message);
    } else {
      setForm({
        daycareRate: result.data.daycareRate,
        boardingRate: result.data.boardingRate,
        transportFee: result.data.transportFee,
        foodFee: result.data.foodFee,
        seasonalSurchargeEnabled: result.data.seasonalSurchargeEnabled,
        seasonalSurchargePercent: result.data.seasonalSurchargePercent,
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPricing();
  }, [loadPricing]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await updatePricingRules(form);
    if (result.error) {
      setError(result.error.message);
    } else {
      setForm({
        daycareRate: result.data.daycareRate,
        boardingRate: result.data.boardingRate,
        transportFee: result.data.transportFee,
        foodFee: result.data.foodFee,
        seasonalSurchargeEnabled: result.data.seasonalSurchargeEnabled,
        seasonalSurchargePercent: result.data.seasonalSurchargePercent,
      });
      setSuccess("Pricing settings saved.");
    }

    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Euro className="h-5 w-5 text-teal-600" aria-hidden />
          Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-stone-500">
          Set default rates and fees used when checking out and recording
          payments.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading pricing settings...
          </div>
        ) : (
          <>
            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                role="status"
              >
                {success}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Daycare Rate"
                type="number"
                min={0}
                step={0.01}
                required
                value={form.daycareRate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    daycareRate: Number(e.target.value),
                  }))
                }
                disabled={saving}
              />
              <Input
                label="Boarding Rate"
                type="number"
                min={0}
                step={0.01}
                required
                value={form.boardingRate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    boardingRate: Number(e.target.value),
                  }))
                }
                disabled={saving}
              />
              <Input
                label="Transport Fee"
                type="number"
                min={0}
                step={0.01}
                required
                value={form.transportFee}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    transportFee: Number(e.target.value),
                  }))
                }
                disabled={saving}
              />
              <Input
                label="Food Fee"
                type="number"
                min={0}
                step={0.01}
                required
                value={form.foodFee}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    foodFee: Number(e.target.value),
                  }))
                }
                disabled={saving}
              />
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm font-medium text-stone-800">
                <input
                  type="checkbox"
                  checked={form.seasonalSurchargeEnabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      seasonalSurchargeEnabled: e.target.checked,
                    }))
                  }
                  disabled={saving}
                  className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                />
                Enable seasonal surcharge
              </label>

              {form.seasonalSurchargeEnabled && (
                <div className="mt-3">
                  <Input
                    label="Surcharge Percent"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.seasonalSurchargePercent}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        seasonalSurchargePercent: Number(e.target.value),
                      }))
                    }
                    disabled={saving}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {saving ? "Saving..." : "Save Pricing"}
            </Button>

            {error === INCOMPLETE_SETUP_MESSAGE && (
              <p className="text-sm text-stone-500">
                Complete account setup before configuring pricing.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
