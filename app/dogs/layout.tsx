import { AppShell } from "@/components/app/AppShell";
import type { ReactNode } from "react";

export default function DogsLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
