import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  icon?: ReactNode;
}

// Soft-tinted fills. Text/border lean on Tier 2 tokens (info/success/warning/danger);
// the pale wash backgrounds are the UI-SPEC tints not covered by a named token.
const variantClasses: Record<AlertVariant, string> = {
  info: "border-info/25 bg-[#EFF6FF] text-info",
  success: "border-success/25 bg-[#ECFDF5] text-success",
  warning: "border-warning/25 bg-[#FFFBEB] text-warning",
  error: "border-danger/25 bg-[#FEF2F2] text-danger",
};

const defaultIcons: Record<AlertVariant, ReactNode> = {
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  ),
};

export function Alert({
  className,
  variant = "info",
  icon,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <span className="mt-0.5 shrink-0">{icon ?? defaultIcons[variant]}</span>
      <div className="flex-1 text-foreground">{children}</div>
    </div>
  );
}
