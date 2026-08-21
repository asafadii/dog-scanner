"use client";

import { Logo } from "@/components/ui/Logo";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { appearScale } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface PortalShellProps {
  children: ReactNode;
  displayName: string;
  onSignOut: () => void;
  className?: string;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PortalShell({
  children,
  displayName,
  onSignOut,
  className,
}: PortalShellProps) {
  const initials = initialsFrom(displayName);
  const hidden = useScrollDirection();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="portal-theme flex min-h-full flex-col bg-background">
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-border bg-white backdrop-blur-sm transition-transform duration-200",
          hidden ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link
            href="/portal"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="DORA home"
          >
            <Logo size={32} variant="purple" />
          </Link>
          <div ref={containerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label="Account menu"
              title={displayName}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                "bg-primary text-sm font-bold text-primary-foreground",
                "transition-opacity hover:opacity-90 focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
              )}
            >
              {initials}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  key="portal-avatar-menu"
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
                  {...appearScale}
                >
                  <Link
                    href="/portal/settings"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <Settings
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    Settings
                  </Link>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onSignOut();
                    }}
                    className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <LogOut
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-3xl flex-1 px-4 py-8",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
