import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-stone-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "min-h-[100px] w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-900",
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

Textarea.displayName = "Textarea";
