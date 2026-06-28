"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  getFacilityCapacity,
  INCOMPLETE_SETUP_MESSAGE,
  updateFacilityCapacity,
} from "@/lib/capacity";
import type { CapacityFormData } from "@/lib/types";
import { Gauge, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function CapacitySettingsSection() {
  const [form, setForm] = useState<CapacityFormData>({
    daycareCapacity: 20,
    boardingCapacity: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCapacity = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getFacilityCapacity();
    if (result.error) {
      setError(result.error.message);
    } else {
      setForm({
        daycareCapacity: result.data.daycareCapacity,
        boardingCapacity: result.data.boardingCapacity,
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCapacity();
  }, [loadCapacity]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await updateFacilityCapacity(form);
    if (result.error) {
      setError(result.error.message);
    } else {
      setForm({
        daycareCapacity: result.data.daycareCapacity,
        boardingCapacity: result.data.boardingCapacity,
      });
      setSuccess("Capacity settings saved.");
    }

    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-5 w-5 text-[oklch(0.531_0.092_185.0)]" aria-hidden />
          Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-stone-500">
          Set maximum approved bookings per day. Approval is blocked when
          capacity is full.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading capacity settings...
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
                label="Daycare Capacity"
                type="number"
                min={1}
                required
                value={form.daycareCapacity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    daycareCapacity: Number(e.target.value),
                  }))
                }
                disabled={saving}
              />
              <Input
                label="Boarding Capacity"
                type="number"
                min={1}
                required
                value={form.boardingCapacity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    boardingCapacity: Number(e.target.value),
                  }))
                }
                disabled={saving}
              />
            </div>

            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {saving ? "Saving..." : "Save Capacity"}
            </Button>

            {error === INCOMPLETE_SETUP_MESSAGE && (
              <p className="text-sm text-stone-500">
                Complete account setup before configuring capacity.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
