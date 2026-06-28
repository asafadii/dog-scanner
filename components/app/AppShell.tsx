"use client";

import { DesktopStaffNav } from "@/components/app/DesktopStaffNav";
import { MobileBottomNav } from "@/components/app/MobileBottomNav";
import { TopBar } from "@/components/app/TopBar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-[#FAFAF8]">
      <TopBar />
      <DesktopStaffNav />
      <main
        className={cn(
          "mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8",
          className,
        )}
      >
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
