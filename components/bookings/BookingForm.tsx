"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getClientDogs, getClients } from "@/lib/clients";
import { getBookingCapacityWarning } from "@/lib/capacity";
import type { BookingFormData, BookingServiceType, Client, Dog } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";

const SERVICE_TYPES: BookingServiceType[] = ["daycare", "boarding"];

export type BookingFormSubmitPhase = "idle" | "saving";

interface BookingDateRow {
  key: string;
  startDate: string;
  endDate: string;
}

interface BookingFormProps {
  onSubmit: (data: BookingFormData | BookingFormData[]) => void | Promise<void>;
  submitLabel?: string;
  initialData?: BookingFormData;
  initialClientId?: string | null;
  submitPhase?: BookingFormSubmitPhase;
}

export function BookingForm({
  onSubmit,
  submitLabel = "Create Booking",
  initialData,
  initialClientId = null,
  submitPhase = "idle",
}: BookingFormProps) {
  const rowIdPrefix = useId();
  const [form, setForm] = useState<BookingFormData>(
    initialData ?? {
      clientId: initialClientId ?? "",
      dogId: "",
      serviceType: "daycare",
      startDate: "",
      endDate: "",
      transportRequired: false,
      notes: "",
    },
  );
  const [dateRows, setDateRows] = useState<BookingDateRow[]>([
    {
      key: `${rowIdPrefix}-0`,
      startDate: initialData?.startDate ?? "",
      endDate: initialData?.endDate ?? "",
    },
  ]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [dogsLoading, setDogsLoading] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  const isSubmitting = submitPhase !== "idle";
  const isCreateMode = !initialData;

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      setClientsLoading(true);
      const result = await getClients();
      if (cancelled) return;

      if (!result.error) {
        setClients(result.data);
      }
      setClientsLoading(false);
    }

    void loadClients();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.clientId) {
      setDogs([]);
      return;
    }

    let cancelled = false;

    async function loadDogs() {
      setDogsLoading(true);
      const result = await getClientDogs(form.clientId);
      if (cancelled) return;

      if (!result.error) {
        setDogs(result.data);
        if (
          form.dogId &&
          !result.data.some((dog) => dog.id === form.dogId)
        ) {
          setForm((prev) => ({ ...prev, dogId: "" }));
        }
      } else {
        setDogs([]);
      }
      setDogsLoading(false);
    }

    void loadDogs();

    return () => {
      cancelled = true;
    };
  }, [form.clientId, form.dogId]);

  useEffect(() => {
    if (!isCreateMode) {
      setCapacityWarning(null);
      return;
    }

    const rowsToCheck = dateRows.filter(
      (row) =>
        row.startDate &&
        row.endDate &&
        row.endDate >= row.startDate,
    );

    if (rowsToCheck.length === 0) {
      setCapacityWarning(null);
      return;
    }

    let cancelled = false;

    async function checkCapacity() {
      for (const row of rowsToCheck) {
        const result = await getBookingCapacityWarning({
          ...form,
          startDate: row.startDate,
          endDate: row.endDate,
        });
        if (cancelled) return;
        if (result.error) {
          setCapacityWarning(null);
          return;
        }
        if (result.data) {
          setCapacityWarning(result.data);
          return;
        }
      }
      if (!cancelled) {
        setCapacityWarning(null);
      }
    }

    void checkCapacity();

    return () => {
      cancelled = true;
    };
  }, [isCreateMode, form, dateRows]);

  function updateField<K extends keyof BookingFormData>(
    key: K,
    value: BookingFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleServiceTypeChange(serviceType: BookingServiceType) {
    setForm((prev) => ({
      ...prev,
      serviceType,
    }));
    // Daycare is always same-day — collapse any boarding range to start date.
    if (serviceType === "daycare") {
      setDateRows((rows) =>
        rows.map((row) => ({ ...row, endDate: row.startDate })),
      );
    }
  }

  function updateDateRow(
    key: string,
    patch: Partial<Pick<BookingDateRow, "startDate" | "endDate">>,
  ) {
    setDateRows((rows) =>
      rows.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...patch };
        if (form.serviceType === "daycare" && patch.startDate !== undefined) {
          next.endDate = patch.startDate;
        }
        return next;
      }),
    );
  }

  function addDateRow() {
    setDateRows((rows) => [
      ...rows,
      {
        key: `${rowIdPrefix}-${rows.length}-${Date.now()}`,
        startDate: "",
        endDate: "",
      },
    ]);
  }

  function removeDateRow(key: string) {
    setDateRows((rows) =>
      rows.length <= 1 ? rows : rows.filter((row) => row.key !== key),
    );
  }

  function handleClientChange(clientId: string) {
    setForm((prev) => ({
      ...prev,
      clientId,
      dogId: "",
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const payloads: BookingFormData[] = dateRows.map((row) => ({
      ...form,
      startDate: row.startDate,
      endDate:
        form.serviceType === "daycare" ? row.startDate : row.endDate,
    }));

    if (payloads.length === 1) {
      void onSubmit(payloads[0]);
      return;
    }

    void onSubmit(payloads);
  }

  function renderDateFields(row: BookingDateRow, index: number) {
    const showRemove = isCreateMode && index > 0;

    return (
      <div
        key={row.key}
        className={cn(
          "space-y-3",
          dateRows.length > 1 &&
            "rounded-xl border border-border bg-surface/40 p-3",
        )}
      >
        {dateRows.length > 1 && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              Date {index + 1}
            </p>
            {showRemove && (
              <button
                type="button"
                onClick={() => removeDateRow(row.key)}
                disabled={isSubmitting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={`Remove date ${index + 1}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        )}

        {form.serviceType === "daycare" ? (
          <Input
            label="Date"
            type="date"
            required
            value={row.startDate}
            onChange={(e) =>
              updateDateRow(row.key, { startDate: e.target.value })
            }
            disabled={isSubmitting}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              required
              value={row.startDate}
              onChange={(e) =>
                updateDateRow(row.key, { startDate: e.target.value })
              }
              disabled={isSubmitting}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={row.endDate}
              onChange={(e) =>
                updateDateRow(row.key, { endDate: e.target.value })
              }
              min={row.startDate || undefined}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="booking-client"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Client
            </label>
            <select
              id="booking-client"
              required
              value={form.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={isSubmitting || clientsLoading}
              className={cn(
                "min-h-[44px] w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                (isSubmitting || clientsLoading) && "cursor-not-allowed opacity-60",
              )}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="booking-dog"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Dog
            </label>
            <select
              id="booking-dog"
              required
              value={form.dogId}
              onChange={(e) => updateField("dogId", e.target.value)}
              disabled={
                isSubmitting || !form.clientId || dogsLoading || dogs.length === 0
              }
              className={cn(
                "min-h-[44px] w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                (isSubmitting || !form.clientId || dogsLoading) &&
                  "cursor-not-allowed opacity-60",
              )}
            >
              <option value="">
                {!form.clientId
                  ? "Select a client first"
                  : dogsLoading
                    ? "Loading dogs..."
                    : dogs.length === 0
                      ? "No dogs for this client"
                      : "Select a dog"}
              </option>
              {dogs.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name} ({dog.breed})
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-foreground">
              Service Type
            </span>
            {/* Segmented control stays operational-flat (no sticker shadow — that
                portal exception is Plan 05 only). Active = mint-wash #EAF4F1
                (documented D-04 exception, Wave-2 precedent). */}
            <div className="flex gap-2">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleServiceTypeChange(type)}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-colors",
                    form.serviceType === type
                      ? "border-primary bg-mint-wash text-primary"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted",
                    isSubmitting && "cursor-not-allowed opacity-60",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {dateRows.map((row, index) => renderDateFields(row, index))}

            {isCreateMode && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={addDateRow}
                className="w-full"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add another date
              </Button>
            )}
          </div>

          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3">
            <input
              type="checkbox"
              checked={form.transportRequired}
              disabled={isSubmitting}
              onChange={(e) =>
                updateField("transportRequired", e.target.checked)
              }
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-foreground">
              Transport required
            </span>
          </label>

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Pickup instructions, special requests..."
            rows={3}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {isCreateMode && capacityWarning && (
        // Capacity-warning callout composed from the Alert component (warning
        // variant); its pale #FFFBEB tint is a documented D-04 exception.
        <Alert variant="warning">{capacityWarning}</Alert>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || !form.clientId || !form.dogId}
      >
        {isSubmitting && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        )}
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
