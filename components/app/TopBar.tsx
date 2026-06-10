"use client";

import { cn } from "@/lib/utils";
import { Dog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dogs": "Dogs",
  "/dogs/new": "New Dog",
  "/checkins": "Check-ins",
  "/settings": "Settings",
};

function getTitle(pathname: string): string {
  if (pathname.startsWith("/dogs/") && pathname !== "/dogs/new") {
    return "Dog Profile";
  }
  return PAGE_TITLES[pathname] ?? "Dog Scanner";
}

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-stone-200/80 bg-[#FAFAF8]/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-teal-700 transition-colors hover:text-teal-800"
          aria-label="Dog Scanner home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Dog className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden font-semibold tracking-tight sm:inline">
            Dog Scanner
          </span>
        </Link>
        <div className="h-5 w-px bg-stone-200" aria-hidden />
        <h1 className="truncate text-base font-semibold text-stone-900">
          {title}
        </h1>
      </div>
    </header>
  );
}
