"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@/lib/supabase/types";
import type { SubscriptionInfo } from "@/lib/types";

export interface FacilityAccessState {
  accessLevel: SubscriptionInfo["accessLevel"];
  daysUntilBlocked: number | null;
  role: UserRole | null;
  loading: boolean;
}

const FacilityAccessContext = createContext<FacilityAccessState>({
  accessLevel: "full",
  daysUntilBlocked: null,
  role: null,
  loading: true,
});

export const FacilityAccessProvider = FacilityAccessContext.Provider;

export function useFacilityAccess(): FacilityAccessState {
  return useContext(FacilityAccessContext);
}

export const WRITE_LOCKED_TITLE = "View only — billing needs updating";
