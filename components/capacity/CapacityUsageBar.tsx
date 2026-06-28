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
        <span className="font-medium text-stone-700">{label}</span>
        <span
          className={cn(
            "tabular-nums",
            isFull
              ? "font-semibold text-red-700"
              : isHigh
                ? "font-semibold text-amber-700"
                : "text-stone-600",
          )}
        >
          {usage.used} / {usage.capacity}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isFull
              ? "bg-red-500"
              : isHigh
                ? "bg-amber-500"
                : "bg-[oklch(0.531_0.092_185.0)]",
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
