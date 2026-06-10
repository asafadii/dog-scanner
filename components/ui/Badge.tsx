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
  default: "bg-stone-100 text-stone-700 border-stone-200",
  teal: "bg-emerald-50 text-emerald-800 border-emerald-200",
  red: "bg-red-50 text-red-800 border-red-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  orange: "bg-orange-50 text-orange-800 border-orange-200",
  violet: "bg-violet-50 text-violet-800 border-violet-200",
  rose: "bg-rose-50 text-rose-800 border-rose-200",
  stone: "bg-stone-50 text-stone-600 border-stone-200",
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
