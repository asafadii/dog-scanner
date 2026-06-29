"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { getCurrentUserProfile } from "@/lib/dogs";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  LogOut,
  PawPrint,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const MENU_ITEMS = [
  { href: "/dogs", label: "Dogs", icon: PawPrint },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  {
    href: "/subscription",
    label: "Manage Subscription",
    icon: CreditCard,
  },
] as const;

function getInitial(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function AvatarDropdown() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState("?");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    void (async () => {
      const result = await getCurrentUserProfile();
      if (result.data?.full_name) {
        setInitial(getInitial(result.data.full_name));
        return;
      }

      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null;
      setInitial(getInitial(metadataName));
    })();
  }, [user]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }, [router, signOut]);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          "bg-[oklch(0.531_0.092_185.0)] text-sm font-semibold text-white",
          "transition-opacity hover:opacity-90 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[oklch(0.531_0.092_185.0)]/40 focus-visible:ring-offset-2",
        )}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {MENU_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] items-center gap-3 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50"
            >
              <Icon className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              {label}
            </Link>
          ))}
          <div className="my-1 border-t border-stone-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50"
          >
            <LogOut className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
