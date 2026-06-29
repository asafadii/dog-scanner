"use client";

import { AvatarDropdown } from "@/components/app/AvatarDropdown";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-stone-200/80 bg-[#FAFAF8]/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center transition-opacity hover:opacity-90"
          aria-label="DORA home"
        >
          <Image
            src="/dora-logo.svg"
            alt="DORA"
            width={120}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>
        <AvatarDropdown />
      </div>
    </header>
  );
}
