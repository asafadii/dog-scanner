"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatAmount } from "@/lib/currency";
import { getFacilitySettings } from "@/lib/facility";
import {
  assignPassToClient,
  listPassTypes,
  PASS_TYPE_DEACTIVATED_MESSAGE,
} from "@/lib/passes";
import type { ClientPassListItem, PassType } from "@/lib/types";
import { Loader2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

interface AssignPassDialogProps {
  open: boolean;
  clientId: string;
  writeLocked: boolean;
  writeLockedTitle: string;
  onClose: () => void;
  onAssigned: (pass: ClientPassListItem) => void;
}

export function AssignPassDialog({
  open,
  clientId,
  writeLocked,
  writeLockedTitle,
  onClose,
  onAssigned,
}: AssignPassDialogProps) {
  const [passTypes, setPassTypes] = useState<PassType[]>([]);
  const [currency, setCurrency] = useState("EUR");
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [passTypeId, setPassTypeId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setPassTypeId("");
    setExpiryDate("");
    setError(null);
    setSubmitting(false);
    setLoadingTypes(true);

    void Promise.all([listPassTypes(), getFacilitySettings()]).then(
      ([typesResult, facilityResult]) => {
        if (typesResult.error) {
          setError(typesResult.error.message);
          setPassTypes([]);
        } else {
          setPassTypes(typesResult.data.filter((type) => type.isActive));
        }
        if (!facilityResult.error) {
          setCurrency(facilityResult.data.currency);
        }
        setLoadingTypes(false);
      },
    );
  }, [open]);

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

    setSubmitting(true);
    setError(null);

    const result = await assignPassToClient(clientId, {
      passTypeId,
      expiryDate,
    });

    if (result.error) {
      setError(
        result.error.code === "deactivated"
          ? PASS_TYPE_DEACTIVATED_MESSAGE
          : result.error.message,
      );
      if (result.error.code === "deactivated") {
        setPassTypes((current) =>
          current.filter((type) => type.id !== passTypeId),
        );
        setPassTypeId("");
      }
      setSubmitting(false);
      return;
    }

    onAssigned(result.data);
    setSubmitting(false);
  }

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
        aria-labelledby="assign-pass-title"
        className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl border border-border bg-surface p-4 shadow-lg sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="assign-pass-title"
              className="text-base font-semibold text-foreground"
            >
              Assign Pass
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Snapshot this preset for the client. Later preset edits
              won&apos;t change it.
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

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
        >
          {loadingTypes ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading pass types...
            </div>
          ) : (
            <Select
              label="Pass type"
              required
              value={passTypeId}
              onChange={(e) => setPassTypeId(e.target.value)}
              disabled={submitting || writeLocked || passTypes.length === 0}
            >
              <option value="">
                {passTypes.length === 0
                  ? "No active pass types"
                  : "Select a pass type"}
              </option>
              {passTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} · {type.serviceType === "daycare" ? "Daycare" : "Boarding"} ·{" "}
                  {formatAmount(type.price, currency)} · {type.occasions}{" "}
                  {type.occasions === 1 ? "occasion" : "occasions"}
                </option>
              ))}
            </Select>
          )}

          {passTypes.length === 0 && !loadingTypes && (
            <p className="text-sm text-muted-foreground">
              Create an active pass type on the Passes page first.
            </p>
          )}

          <Input
            label="Expiry date"
            type="date"
            required
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={submitting || writeLocked}
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Button
            type="submit"
            className="w-full"
            disabled={
              submitting ||
              writeLocked ||
              loadingTypes ||
              passTypes.length === 0
            }
            title={writeLocked ? writeLockedTitle : undefined}
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            Assign pass
          </Button>
        </form>
      </div>
    </div>
  );
}
