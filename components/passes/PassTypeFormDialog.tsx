"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { getCurrencySymbol } from "@/lib/currency";
import {
  createPassType,
  deactivatePassType,
  updatePassType,
} from "@/lib/passes";
import type { BookingServiceType, PassType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const SERVICE_TYPES: BookingServiceType[] = ["daycare", "boarding"];

interface PassTypeFormDialogProps {
  open: boolean;
  passType: PassType | null;
  currency: string;
  writeLocked: boolean;
  writeLockedTitle: string;
  onClose: () => void;
  onSaved: (passType: PassType) => void;
  onDeactivated: (passType: PassType) => void;
}

interface FormState {
  name: string;
  serviceType: BookingServiceType;
  price: string;
  occasions: number;
}

const emptyForm: FormState = {
  name: "",
  serviceType: "daycare",
  price: "",
  occasions: 10,
};

export function PassTypeFormDialog({
  open,
  passType,
  currency,
  writeLocked,
  writeLockedTitle,
  onClose,
  onSaved,
  onDeactivated,
}: PassTypeFormDialogProps) {
  const isEdit = Boolean(passType);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setConfirmDeactivate(false);
    setSubmitting(false);

    if (passType) {
      setForm({
        name: passType.name,
        serviceType: passType.serviceType,
        price: String(passType.price),
        occasions: passType.occasions,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, passType]);

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || writeLocked) return;

    const price = Number(form.price);
    setSubmitting(true);
    setError(null);

    const payload = {
      name: form.name,
      serviceType: form.serviceType,
      price,
      occasions: form.occasions,
    };

    const result = passType
      ? await updatePassType(passType.id, payload)
      : await createPassType(payload);

    if (result.error) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    onSaved(result.data);
    setSubmitting(false);
  }

  async function handleDeactivate() {
    if (!passType || submitting || writeLocked) return;

    setSubmitting(true);
    setError(null);

    const result = await deactivatePassType(passType.id);
    if (result.error) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    onDeactivated(result.data);
    setSubmitting(false);
  }

  const currencySymbol = getCurrencySymbol(currency);
  const titleId = "pass-type-form-title";

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
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl border border-border bg-surface p-4 shadow-lg sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-base font-semibold text-foreground"
            >
              {isEdit ? "Edit Pass Type" : "New Pass Type"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? "Changes apply to future assignments only."
                : "Reusable preset for daycare or boarding bundles."}
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

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="10-day daycare pass"
            disabled={submitting || writeLocked}
          />

          <div>
            <span className="mb-2 block text-sm font-medium text-foreground">
              Type
            </span>
            <div className="flex gap-2">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={submitting || writeLocked}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, serviceType: type }))
                  }
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-colors",
                    form.serviceType === type
                      ? "border-primary bg-mint-wash text-primary"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted",
                    (submitting || writeLocked) && "cursor-not-allowed opacity-60",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="pass-type-price"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Price
            </label>
            <div className="relative">
              <Input
                id="pass-type-price"
                type="number"
                min={0}
                step={0.01}
                required
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                disabled={submitting || writeLocked}
                className="pr-14"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {currencySymbol}
              </span>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Occasions
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Decrease occasions"
                disabled={submitting || writeLocked || form.occasions <= 1}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    occasions: Math.max(1, prev.occasions - 1),
                  }))
                }
              >
                <Minus className="h-4 w-4" aria-hidden />
              </Button>
              <Input
                id="pass-type-occasions"
                type="number"
                min={1}
                step={1}
                required
                value={form.occasions}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  setForm((prev) => ({
                    ...prev,
                    occasions: Number.isFinite(next) ? Math.max(1, next) : 1,
                  }));
                }}
                disabled={submitting || writeLocked}
                className="text-center"
                aria-label="Occasions"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Increase occasions"
                disabled={submitting || writeLocked}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    occasions: prev.occasions + 1,
                  }))
                }
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="error">{error}</Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || writeLocked}
            title={writeLocked ? writeLockedTitle : undefined}
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            {isEdit ? "Save changes" : "Create pass type"}
          </Button>

          {isEdit && passType?.isActive && (
            confirmDeactivate ? (
              <Alert variant="warning">
                <p>
                  Deactivate this pass type? It stays listed, but staff
                  won&apos;t be able to assign it to new clients.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => setConfirmDeactivate(false)}
                  >
                    Keep active
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={submitting || writeLocked}
                    title={writeLocked ? writeLockedTitle : undefined}
                    onClick={() => void handleDeactivate()}
                  >
                    {submitting && (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    )}
                    Deactivate
                  </Button>
                </div>
              </Alert>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={submitting || writeLocked}
                title={writeLocked ? writeLockedTitle : undefined}
                onClick={() => setConfirmDeactivate(true)}
              >
                Deactivate
              </Button>
            )
          )}
        </form>
      </div>
    </div>
  );
}
