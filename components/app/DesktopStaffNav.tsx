"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bookings", label: "Bookings" },
  { href: "/checkins", label: "Check-ins" },
  { href: "/reports", label: "Reports" },
] as const;

export function DesktopStaffNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden border-b border-stone-200/80 bg-white/95 md:block"
      aria-label="Staff navigation"
    >
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        {NAV_ITEMS.map(({ href, label }) => {
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
                "shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-[oklch(0.531_0.092_185.0)] text-[oklch(0.531_0.092_185.0)]"
                  : "border-transparent text-stone-500 hover:text-stone-800",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
