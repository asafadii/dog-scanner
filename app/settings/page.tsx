"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { CapacitySettingsSection } from "@/components/settings/CapacitySettingsSection";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Building2, Bell, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

const PLACEHOLDER_SECTIONS = [
  {
    icon: Building2,
    title: "Facility",
    description: "Facility name, address, and operating hours.",
  },
  {
    icon: User,
    title: "Staff Accounts",
    description: "Manage trainer and staff access.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Alert preferences for medication reminders.",
  },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Settings
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Facility preferences and account settings.
        </p>
      </div>

      {user && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-stone-600">{user.email}</p>
            <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
              <LogOut className="h-4 w-4" aria-hidden />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      )}

      <CapacitySettingsSection />

      <div className="space-y-4">
        {PLACEHOLDER_SECTIONS.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="opacity-80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-5 w-5 text-stone-400" aria-hidden />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-stone-500">{description}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-stone-400">
                Placeholder
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
