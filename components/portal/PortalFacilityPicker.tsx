"use client";

import { Button } from "@/components/ui/Button";
import type { LinkedClient } from "@/lib/portal/auth";
import { unlinkFacility } from "@/lib/portal/facilities";
import { cn } from "@/lib/utils";
import { Building2, Loader2 } from "lucide-react";
import { useState } from "react";

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

function nextFacilityAfterUnlink(
  options: FacilityOption[],
  unlinkedFacilityId: string,
): FacilityOption | null {
  const index = options.findIndex(
    (option) => option.facilityId === unlinkedFacilityId,
  );
  const remaining = options.filter(
    (option) => option.facilityId !== unlinkedFacilityId,
  );
  if (remaining.length === 0) return null;
  if (index < 0) return remaining[0];
  return remaining[Math.min(index, remaining.length - 1)] ?? remaining[0];
}

interface PortalFacilityPickerProps {
  options: FacilityOption[];
  selectedFacilityId: string;
  onChange: (option: FacilityOption) => void;
  className?: string;
  /** When false, only the control is rendered (parent supplies the heading). */
  showLabel?: boolean;
  label?: string;
  labelClassName?: string;
  onUnlinked?: (unlinkedFacilityId: string) => void | Promise<void>;
}

export function PortalFacilityPicker({
  options,
  selectedFacilityId,
  onChange,
  className,
  showLabel = true,
  label = "Daycares",
  labelClassName = "flex items-center gap-2 text-sm font-medium text-foreground",
  onUnlinked,
}: PortalFacilityPickerProps) {
  const [unlinkingFacilityId, setUnlinkingFacilityId] = useState<string | null>(
    null,
  );
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const allowUnlink = Boolean(onUnlinked);

  async function handleUnlink(facility: FacilityOption) {
    const confirmed = window.confirm(
      `Unlink from ${facility.facilityName}? You can re-link anytime using their facility code.`,
    );
    if (!confirmed) return;

    setUnlinkingFacilityId(facility.facilityId);
    setUnlinkError(null);

    const result = await unlinkFacility(facility.facilityId);
    if (result.error) {
      setUnlinkError(result.error.message);
      setUnlinkingFacilityId(null);
      return;
    }

    if (facility.facilityId === selectedFacilityId) {
      const next = nextFacilityAfterUnlink(options, facility.facilityId);
      if (next) onChange(next);
    }

    await onUnlinked?.(facility.facilityId);
    setUnlinkingFacilityId(null);
  }

  if (options.length === 0) return null;

  function unlinkButton(facility: FacilityOption) {
    const unlinking = unlinkingFacilityId === facility.facilityId;
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={unlinking}
        aria-label={`Unlink from ${facility.facilityName}`}
        onClick={(event) => {
          event.stopPropagation();
          void handleUnlink(facility);
        }}
      >
        {unlinking ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {unlinking ? "Unlinking..." : "Unlink"}
      </Button>
    );
  }

  if (options.length === 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {showLabel && (
          <span className={labelClassName}>
            <Building2 className="h-4 w-4 text-primary" aria-hidden />
            {label}
          </span>
        )}
        <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground shadow-sm">
          <span>{options[0].facilityName}</span>
          {allowUnlink ? unlinkButton(options[0]) : null}
        </div>
        {unlinkError ? (
          <p
            className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {unlinkError}
          </p>
        ) : null}
      </div>
    );
  }

  if (!allowUnlink) {
    return (
      <div className={cn("space-y-2", className)}>
        {showLabel && (
          <label htmlFor="portal-facility" className={labelClassName}>
            <Building2 className="h-4 w-4 text-primary" aria-hidden />
            {label}
          </label>
        )}
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
          aria-label={showLabel ? undefined : label}
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

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <span className={labelClassName}>
          <Building2 className="h-4 w-4 text-primary" aria-hidden />
          {label}
        </span>
      )}
      <ul className="space-y-2">
        {options.map((option) => {
          const isSelected = option.facilityId === selectedFacilityId;
          return (
            <li
              key={option.facilityId}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <button
                type="button"
                onClick={() => onChange(option)}
                aria-current={isSelected ? "true" : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span
                  className={cn(
                    "h-3 w-3 shrink-0 rounded-full border-2",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border bg-surface",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {option.facilityName}
                </span>
                {isSelected ? (
                  <span className="hidden shrink-0 rounded-xl bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground sm:inline-flex">
                    Selected
                  </span>
                ) : null}
              </button>
              {unlinkButton(option)}
            </li>
          );
        })}
      </ul>
      {unlinkError ? (
        <p
          className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {unlinkError}
        </p>
      ) : null}
    </div>
  );
}
