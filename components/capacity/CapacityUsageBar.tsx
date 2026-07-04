"use client";

import type { CapacityUsage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CapacityUsageBarProps {
  label: string;
  usage: CapacityUsage;
}

function usagePercent(usage: CapacityUsage): number {
  if (usage.capacity <= 0) return 0;
  return Math.min(100, Math.round((usage.used / usage.capacity) * 100));
}

export function CapacityUsageBar({ label, usage }: CapacityUsageBarProps) {
  const percent = usagePercent(usage);
  const isHigh = percent >= 80;
  const isFull = usage.used >= usage.capacity;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span
          className={cn(
            "tabular-nums",
            isFull
              ? "font-semibold text-danger"
              : isHigh
                ? "font-semibold text-warning"
                : "text-muted-foreground",
          )}
        >
          {usage.used} / {usage.capacity}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isFull
              ? "bg-danger"
              : isHigh
                ? "bg-warning"
                : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={usage.used}
          aria-valuemin={0}
          aria-valuemax={usage.capacity}
          aria-label={`${label}: ${usage.used} of ${usage.capacity} spots used`}
        />
      </div>
    </div>
  );
}
