"use client";

import { clarity, isClarityEnabled } from "@/lib/clarity";
import { getLinkedClients } from "@/lib/portal/auth";
import { useEffect } from "react";

/** Tags the Clarity session as portal with facilityId (no PII). */
export function ClarityPortalTags() {
  useEffect(() => {
    if (!isClarityEnabled()) return;

    let cancelled = false;

    void getLinkedClients().then((result) => {
      if (cancelled || result.error || !result.data?.length) {
        if (!cancelled) {
          clarity("set", "context", "portal");
        }
        return;
      }

      clarity("set", "facilityId", result.data[0].facilityId);
      clarity("set", "context", "portal");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
