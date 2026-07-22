import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export type StatCardAccent = "default" | "ink" | "mint" | "marker";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  label: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
  accent?: StatCardAccent;
}

export function StatCard({
  className,
  value,
  label,
  icon,
  trend,
  accent = "default",
  ...props
}: StatCardProps) {
  const isInk = accent === "ink";
  const isMarker = accent === "marker";
  const textColor = isInk
    ? "text-white"
    : isMarker
      ? "text-[#5a4a1e]"
      : "text-primary";
  const iconColor = isInk
    ? "text-white/70"
    : isMarker
      ? "text-[#5a4a1e]"
      : "text-muted-foreground";
  const labelColor = isInk
    ? "text-white/80"
    : isMarker
      ? "text-[#5a4a1e]"
      : "text-muted-foreground";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border p-5 shadow-sm",
        accent === "default" && "border-border bg-surface",
        accent === "ink" && "border-transparent bg-[#06342F]",
        accent === "mint" && "border-border bg-mint-wash",
        accent === "marker" && "border-[#e8c84a] bg-marker",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("font-display text-[28px] leading-[1.1]", textColor)}>
          {value}
        </span>
        {icon && <span className={cn("shrink-0", iconColor)}>{icon}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-[13px]", labelColor)}>{label}</span>
        {trend}
      </div>
    </div>
  );
}
