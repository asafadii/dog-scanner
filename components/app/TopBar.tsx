"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dogs": "Dogs",
  "/dogs/new": "New Dog",
  "/clients": "Clients",
  "/clients/new": "New Client",
  "/bookings": "Bookings",
  "/bookings/new": "New Booking",
  "/checkins": "Check-ins",
  "/reports": "Reports",
  "/settings": "Settings",
};

function getTitle(pathname: string): string {
  if (pathname.startsWith("/dogs/") && pathname !== "/dogs/new") {
    return "Dog Profile";
  }
  if (pathname.startsWith("/clients/") && pathname !== "/clients/new") {
    return pathname.endsWith("/edit") ? "Edit Client" : "Client Profile";
  }
  if (pathname.startsWith("/bookings/") && pathname !== "/bookings/new") {
    return pathname.endsWith("/edit") ? "Edit Booking" : "Booking Details";
  }
  return PAGE_TITLES[pathname] ?? "DORA";
}

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const title = getTitle(pathname);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

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
        <div className="h-5 w-px bg-stone-200" aria-hidden />
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-stone-900">
          {title}
        </h1>
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="shrink-0 text-stone-600"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        )}
      </div>
    </header>
  );
}
