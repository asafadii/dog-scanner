"use client";

import { NAV_ITEMS, isActiveNav } from "@/components/app/navItems";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DesktopStaffNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden border-b border-border bg-surface/95 md:block"
      aria-label="Staff navigation"
    >
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = isActiveNav(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
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
