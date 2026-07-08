import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export type StatCardAccent = "default" | "ink" | "mint";

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

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border p-5 shadow-sm",
        accent === "default" && "border-border bg-surface",
        accent === "ink" && "border-transparent bg-[#06342F]",
        accent === "mint" && "border-border bg-mint-wash",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "font-display text-[28px] leading-[1.1]",
            isInk ? "text-white" : "text-primary",
          )}
        >
          {value}
        </span>
        {icon && (
          <span
            className={cn(
              "shrink-0",
              isInk ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-[13px]",
            isInk ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        {trend}
      </div>
    </div>
  );
}
