"use client";

import type { BookingSeriesCancelScope } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

interface SeriesCancelDialogProps {
  open: boolean;
  dateLabel: string;
  submitting?: boolean;
  onSelect: (scope: BookingSeriesCancelScope) => void;
  onClose: () => void;
  action?: "cancel" | "edit";
}

export function SeriesCancelDialog({
  open,
  dateLabel,
  submitting = false,
  onSelect,
  onClose,
  action = "cancel",
}: SeriesCancelDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  const isEdit = action === "edit";
  const verb = isEdit ? "updates" : "cancels";
  const verbCapitalized = isEdit ? "Updates" : "Cancels";

  const options: {
    scope: BookingSeriesCancelScope;
    title: string;
    description: string;
  }[] = [
    {
      scope: "this",
      title: "This booking",
      description: `Only ${verb} ${dateLabel}`,
    },
    {
      scope: "future",
      title: "This and following bookings",
      description: `${verbCapitalized} ${dateLabel} and every occurrence after it`,
    },
    {
      scope: "all",
      title: "All bookings in the series",
      description: isEdit
        ? "Updates the entire recurring booking"
        : "Cancels the entire recurring booking",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        disabled={submitting}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="series-scope-title"
        className="relative z-10 w-full rounded-t-2xl border border-border bg-surface p-4 shadow-lg sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2
              id="series-scope-title"
              className="text-base font-semibold text-foreground"
            >
              {isEdit ? "Edit recurring booking" : "Cancel recurring booking"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? "Choose which visits to update."
                : "Choose which visits to cancel."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.scope}
              type="button"
              disabled={submitting}
              onClick={() => onSelect(option.scope)}
              className={cn(
                "w-full rounded-xl border border-border bg-surface px-4 py-4 text-left transition-colors",
                "hover:border-primary/40 hover:bg-muted",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <p className="text-sm font-semibold text-foreground">
                {option.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
