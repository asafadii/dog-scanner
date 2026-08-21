import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-soft";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-[var(--dora-primary-deep)] focus-visible:ring-ring",
  secondary:
    "bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-ring",
  outline:
    "border border-border bg-surface text-foreground hover:bg-muted focus-visible:ring-ring",
  ghost: "text-muted-foreground hover:bg-muted focus-visible:ring-ring",
  danger:
    "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger",
  "danger-soft":
    "bg-danger/70 text-white hover:bg-danger/80 focus-visible:ring-danger",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-lg gap-1.5",
  md: "h-11 min-h-[44px] px-4 text-sm rounded-xl gap-2",
  lg: "h-12 min-h-[44px] px-6 text-base rounded-xl gap-2",
  icon: "h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
