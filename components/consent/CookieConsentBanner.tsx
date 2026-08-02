"use client";

import { Button } from "@/components/ui/Button";
import {
  applyClarityConsent,
  COOKIE_PREFERENCES_EVENT,
  getStoredConsent,
  isClarityEnabled,
  setStoredConsent,
  type CookieConsent,
} from "@/lib/clarity";
import { useEffect, useState } from "react";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isClarityEnabled()) {
      return;
    }

    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
      applyClarityConsent(null);
    } else {
      applyClarityConsent(stored);
    }

    function handleOpenPreferences() {
      setVisible(true);
    }

    window.addEventListener(COOKIE_PREFERENCES_EVENT, handleOpenPreferences);
    return () => {
      window.removeEventListener(
        COOKIE_PREFERENCES_EVENT,
        handleOpenPreferences,
      );
    };
  }, []);

  function choose(consent: CookieConsent) {
    setStoredConsent(consent);
    applyClarityConsent(consent);
    setVisible(false);
  }

  if (!visible || !isClarityEnabled()) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-surface p-4 shadow-[0_-4px_24px_rgba(6,52,47,0.12)]"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm text-foreground">
          We use cookies for analytics to understand how DORA is used and
          improve the product. You can accept or decline analytics cookies.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => choose("denied")}
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => choose("granted")}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
