"use client";

import { CookiePreferencesButton } from "@/components/consent/CookiePreferencesButton";
import { FacilitySettingsSection } from "@/components/settings/FacilitySettingsSection";
import { FacilityCodeSection } from "@/components/settings/FacilityCodeSection";
import { BookingFormSection } from "@/components/settings/BookingFormSection";
import { CapacitySettingsSection } from "@/components/settings/CapacitySettingsSection";
import { KennelsSettingsSection } from "@/components/settings/KennelsSettingsSection";
import { PricingSettingsSection } from "@/components/settings/PricingSettingsSection";
import { StaffAccountsSection } from "@/components/settings/StaffAccountsSection";
import { NotificationSettingsSection } from "@/components/settings/NotificationSettingsSection";
import { Card, CardContent } from "@/components/ui/Card";
import { isClarityEnabled } from "@/lib/clarity";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Facility preferences and account settings.
        </p>
      </div>

      <FacilitySettingsSection />

      <FacilityCodeSection />

      <BookingFormSection />

      <CapacitySettingsSection />

      <KennelsSettingsSection />

      <PricingSettingsSection />

      <StaffAccountsSection />

      <NotificationSettingsSection />

      {isClarityEnabled() ? (
        <Card>
          <CardContent className="p-4">
            <CookiePreferencesButton className="text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:ring-ring focus-visible:ring-offset-background" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
