import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { KeyRound } from "lucide-react";
import Link from "next/link";

export default function PortalSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your portal account.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Link
            href="/forgot-password"
            className="flex min-h-[44px] items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <KeyRound className="h-4 w-4 text-primary" aria-hidden />
            Change password
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
