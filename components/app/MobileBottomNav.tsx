"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Home,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/checkins", label: "Check-ins", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
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
            (href === "/bookings" && pathname.startsWith("/bookings")) ||
            (href === "/reports" && pathname.startsWith("/reports")) ||
            (href === "/checkins" && pathname.startsWith("/checkins"));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors sm:text-xs",
                isActive
                  ? "text-[oklch(0.480_0.085_185.0)]"
                  : "text-stone-500 hover:text-stone-700",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  isActive ? "text-[oklch(0.531_0.092_185.0)]" : "text-stone-400",
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
