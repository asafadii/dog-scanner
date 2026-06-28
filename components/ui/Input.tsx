import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-stone-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-4 text-base text-stone-900",
            "placeholder:text-stone-400",
            "focus-visible:border-[oklch(0.531_0.092_185.0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.531_0.092_185.0)]/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-300 focus-visible:ring-red-500/20",
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
