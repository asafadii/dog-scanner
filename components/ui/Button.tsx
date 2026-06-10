import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-teal-600 text-white shadow-sm hover:bg-teal-700 focus-visible:ring-teal-500",
  secondary:
    "bg-stone-100 text-stone-800 hover:bg-stone-200 focus-visible:ring-stone-400",
  outline:
    "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 focus-visible:ring-teal-500",
  ghost: "text-stone-600 hover:bg-stone-100 focus-visible:ring-stone-400",
  danger:
    "bg-stone-700 text-white hover:bg-stone-800 focus-visible:ring-stone-500",
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
