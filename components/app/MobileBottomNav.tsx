"use client";

import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Home,
  PawPrint,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dogs", label: "Dogs", icon: PawPrint },
  { href: "/checkins", label: "Check-ins", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200/80 bg-white/95 backdrop-blur-sm md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href === "/dogs" && pathname.startsWith("/dogs"));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[56px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-teal-700"
                  : "text-stone-500 hover:text-stone-700",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  isActive ? "text-teal-600" : "text-stone-400",
                )}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
