import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  label: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
}

export function StatCard({
  className,
  value,
  label,
  icon,
  trend,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5 shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-display text-[28px] leading-[1.1] text-primary">
          {value}
        </span>
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        {trend}
      </div>
    </div>
  );
}
