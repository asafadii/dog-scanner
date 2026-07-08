import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "teal"
  | "red"
  | "amber"
  | "orange"
  | "violet"
  | "rose"
  | "stone";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground border-border",
  teal: "bg-white text-success border-success/60",
  red: "bg-danger/10 text-danger border-danger/25",
  amber: "bg-warning/10 text-warning border-warning/25",
  orange: "bg-warning/10 text-warning border-warning/25",
  violet: "bg-info/10 text-info border-info/25",
  rose: "bg-info/10 text-info border-info/25",
  stone: "bg-muted text-muted-foreground border-border",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
