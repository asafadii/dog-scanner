"use client";

import { clarity, isClarityEnabled } from "@/lib/clarity";
import { getCurrentUserProfile } from "@/lib/dogs";
import { useEffect } from "react";

/** Tags the Clarity session with staff facilityId + role (no PII). */
export function ClarityStaffTags() {
  useEffect(() => {
    if (!isClarityEnabled()) return;

    let cancelled = false;

    void getCurrentUserProfile().then((result) => {
      if (cancelled || !result.data) return;
      clarity("set", "facilityId", result.data.facility_id);
      clarity("set", "role", result.data.role);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
