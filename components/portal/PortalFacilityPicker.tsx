"use client";

import type { LinkedClient } from "@/lib/portal/auth";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export interface FacilityOption {
  facilityId: string;
  facilityName: string;
  clientId: string;
}

export function buildFacilityOptions(
  linkedClients: LinkedClient[],
): FacilityOption[] {
  const byFacility = new Map<string, FacilityOption>();

  for (const client of linkedClients) {
    if (!byFacility.has(client.facilityId)) {
      byFacility.set(client.facilityId, {
        facilityId: client.facilityId,
        facilityName: client.facilityName,
        clientId: client.id,
      });
    }
  }

  return [...byFacility.values()];
}

interface PortalFacilityPickerProps {
  options: FacilityOption[];
  selectedFacilityId: string;
  onChange: (option: FacilityOption) => void;
  className?: string;
}

export function PortalFacilityPicker({
  options,
  selectedFacilityId,
  onChange,
  className,
}: PortalFacilityPickerProps) {
  if (options.length === 0) return null;

  if (options.length === 1) {
    return (
      <div className={cn("space-y-2", className)}>
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Building2 className="h-4 w-4 text-primary" aria-hidden />
          Your facility
        </span>
        <div className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground shadow-sm">
          {options[0].facilityName}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor="portal-facility"
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <Building2 className="h-4 w-4 text-primary" aria-hidden />
        Your facility
      </label>
      <select
        id="portal-facility"
        value={selectedFacilityId}
        onChange={(event) => {
          const option = options.find(
            (item) => item.facilityId === event.target.value,
          );
          if (option) onChange(option);
        }}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((option) => (
          <option key={option.facilityId} value={option.facilityId}>
            {option.facilityName}
          </option>
        ))}
      </select>
    </div>
  );
}
