import { AppShell } from "@/components/app/AppShell";
import type { ReactNode } from "react";

export default function CheckinsLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
