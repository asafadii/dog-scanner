"use client";

import { isClarityEnabled, openCookiePreferences } from "@/lib/clarity";
import { cn } from "@/lib/utils";

interface CookiePreferencesButtonProps {
  className?: string;
}

export function CookiePreferencesButton({
  className,
}: CookiePreferencesButtonProps) {
  if (!isClarityEnabled()) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => openCookiePreferences()}
      className={cn(
        "w-fit rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2",
        className,
      )}
    >
      Cookie preferences
    </button>
  );
}
