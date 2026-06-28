import { AppShell } from "@/components/app/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import type { ReactNode } from "react";

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
