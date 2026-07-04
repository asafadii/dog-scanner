import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type PillVariant = "active" | "inactive";

export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillVariant;
  dot?: boolean;
  dotClassName?: string;
  children?: ReactNode;
}

const variantClasses: Record<PillVariant, string> = {
  active: "bg-primary text-primary-foreground",
  inactive: "border border-border bg-surface text-muted-foreground",
};

export function Pill({
  className,
  variant = "inactive",
  dot = false,
  dotClassName,
  type = "button",
  children,
  ...props
}: PillProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 rounded-full bg-current", dotClassName)}
        />
      )}
      {children}
    </button>
  );
}
