"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getFacilityNotificationPreferences,
  INCOMPLETE_SETUP_MESSAGE,
  updateFacilityNotificationPreferences,
  type NotificationPreferencesFormData,
} from "@/lib/notifications";
import { Bell, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const TOGGLES: {
  key: keyof NotificationPreferencesFormData;
  title: string;
  description: string;
}[] = [
  {
    key: "notifyNewBooking",
    title: "New bookings",
    description: "Email me when a new (first-time) client books.",
  },
  {
    key: "notifyReturningDogBooking",
    title: "Returning client bookings",
    description: "Email me when a returning client books.",
  },
  {
    key: "notifyBookingCancelledByClient",
    title: "Booking cancellations",
    description: "Email me when a client cancels a booking.",
  },
];

export function NotificationSettingsSection() {
  const [form, setForm] = useState<NotificationPreferencesFormData>({
    notifyNewBooking: true,
    notifyReturningDogBooking: true,
    notifyBookingCancelledByClient: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getFacilityNotificationPreferences();
    if (result.error) {
      setError(result.error.message);
    } else {
      setForm({
        notifyNewBooking: result.data.notifyNewBooking,
        notifyReturningDogBooking: result.data.notifyReturningDogBooking,
        notifyBookingCancelledByClient:
          result.data.notifyBookingCancelledByClient,
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await updateFacilityNotificationPreferences(form);
    if (result.error) {
      setError(result.error.message);
    } else {
      setForm({
        notifyNewBooking: result.data.notifyNewBooking,
        notifyReturningDogBooking: result.data.notifyReturningDogBooking,
        notifyBookingCancelledByClient:
          result.data.notifyBookingCancelledByClient,
      });
      setSuccess("Notification settings saved.");
    }

    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-5 w-5 text-primary" aria-hidden />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-muted-foreground">
          Choose which booking emails this facility receives.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading notification settings...
          </div>
        ) : (
          <>
            {error && (
              <div
                className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {/* #FEF2F2 documented error-tint (D-04, mirrors Alert.tsx) */}
                {error}
              </div>
            )}

            {success && (
              <div
                className="rounded-xl border border-success/25 bg-[#ECFDF5] px-4 py-3 text-sm text-success"
                role="status"
              >
                {/* #ECFDF5 documented success-tint (D-04, mirrors Alert.tsx) */}
                {success}
              </div>
            )}

            <div className="space-y-1">
              {TOGGLES.map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-sm font-medium text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={form[toggle.key]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        [toggle.key]: event.target.checked,
                      }))
                    }
                    disabled={saving}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>
                    <span className="block">{toggle.title}</span>
                    <span className="block font-normal text-muted-foreground">
                      {toggle.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              Account and billing emails (trial reminders, access changes)
              always send and can&apos;t be turned off, since they protect your
              access to DORA.
            </p>

            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {saving ? "Saving..." : "Save Notifications"}
            </Button>

            {error === INCOMPLETE_SETUP_MESSAGE && (
              <p className="text-sm text-muted-foreground">
                Complete account setup before configuring notifications.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
