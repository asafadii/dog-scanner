"use client";

import { FacilitySettingsSection } from "@/components/settings/FacilitySettingsSection";
import { CapacitySettingsSection } from "@/components/settings/CapacitySettingsSection";
import { KennelsSettingsSection } from "@/components/settings/KennelsSettingsSection";
import { PricingSettingsSection } from "@/components/settings/PricingSettingsSection";
import { StaffAccountsSection } from "@/components/settings/StaffAccountsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Bell } from "lucide-react";

const PLACEHOLDER_SECTIONS = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Alert preferences for medication reminders.",
  },
];

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

      <CapacitySettingsSection />

      <KennelsSettingsSection />

      <PricingSettingsSection />

      <StaffAccountsSection />

      <div className="space-y-4">
        {PLACEHOLDER_SECTIONS.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="opacity-80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{description}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Placeholder
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
