"use client";

import { AvatarDropdown } from "@/components/app/AvatarDropdown";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="DORA home"
        >
          <Logo size={32} />
        </Link>
        <AvatarDropdown />
      </div>
    </header>
  );
}
