"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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

  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* Mint operational top bar (documented mint-wash literals #EAF4F1 / #D9EAE4) */}
      <header className="border-b border-[#D9EAE4] bg-[#EAF4F1] backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link
            href="/portal"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="DORA home"
          >
            <Image
              src="/dora-icon.svg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
              aria-hidden
            />
            <span className="font-display text-lg font-bold text-primary">
              hello DORA
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
              aria-hidden
              title={displayName}
            >
              {initials}
            </span>
            <Button variant="outline" size="sm" onClick={onSignOut}>
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </Button>
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
