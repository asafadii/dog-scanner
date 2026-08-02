export const COOKIE_CONSENT_KEY = "dora-cookie-consent";
export const COOKIE_PREFERENCES_EVENT = "dora-open-cookie-preferences";

export type CookieConsent = "granted" | "denied";

type ClarityFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

export function getClarityProjectId(): string | null {
  const id = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (!id || !id.trim()) {
    return null;
  }
  return id.trim();
}

export function isClarityEnabled(): boolean {
  return getClarityProjectId() !== null;
}

/** Guarded Clarity call — no-ops when the script is absent or not yet loaded. */
export function clarity(...args: unknown[]): void {
  if (typeof window === "undefined") {
    return;
  }
  if (typeof window.clarity !== "function") {
    return;
  }
  window.clarity(...args);
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === "granted" || value === "denied") {
      return value;
    }
  } catch {
    // localStorage may be unavailable (private mode, etc.)
  }
  return null;
}

export function setStoredConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, consent);
  } catch {
    // ignore write failures
  }
}

/** Sync Clarity consentv2 from a choice. Defaults to denied when unset. */
export function applyClarityConsent(consent: CookieConsent | null): void {
  const status = consent === "granted" ? "granted" : "denied";
  clarity("consentv2", {
    ad_Storage: status,
    analytics_Storage: status,
  });
}

/** Re-open the cookie banner so the visitor can change their choice. */
export function openCookiePreferences(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT));
}
