"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  CURRENCY_OPTIONS,
  getFacilitySettings,
  updateFacilitySettings,
} from "@/lib/facility";
import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { Building2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function FacilitySettingsSection() {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getFacilitySettings();
    if (result.error) {
      setError(result.error.message);
    } else {
      setName(result.data.name ?? "");
      setCurrency(result.data.currency);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await updateFacilitySettings(name, currency);
    if (result.error) {
      setError(result.error.message);
    } else {
      setName(result.data.name ?? "");
      setCurrency(result.data.currency);
      setSuccess("Facility settings saved.");
    }

    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-[oklch(0.531_0.092_185.0)]" aria-hidden />
          Facility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-stone-500">
          Set your facility name and the currency used for pricing and payments.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading facility settings...
          </div>
        ) : (
          <>
            <Input
              label="Facility name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Happy Paws Daycare"
              disabled={saving}
            />

            <div>
              <label
                htmlFor="facility-currency"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Currency
              </label>
              <select
                id="facility-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={saving}
                className="min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-[oklch(0.531_0.092_185.0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.531_0.092_185.0)]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {CURRENCY_OPTIONS.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-emerald-700" role="status">
                {success}
              </p>
            )}

            {error !== INCOMPLETE_SETUP_MESSAGE && (
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                {saving ? "Saving..." : "Save facility settings"}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
