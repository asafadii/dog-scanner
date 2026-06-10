import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Building2, Bell, User } from "lucide-react";

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
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Settings
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Facility and account preferences — coming in a future sprint.
        </p>
      </div>

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
