"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getClientDogs, getClients } from "@/lib/clients";
import {
  getBookingCapacityWarning,
  getRecurringBookingCapacityWarning,
} from "@/lib/capacity";
import {
  validateBookingFormData,
  validateRecurringBookingInput,
} from "@/lib/bookings";
import {
  addCalendarMonths,
  enumerateRecurringOccurrences,
  formatRecurringBookingSummary,
  MAX_RECURRING_OCCURRENCES,
  WEEKDAY_LABELS,
  weekdayFromDateString,
} from "@/lib/recurrence";
import type {
  BookingFormData,
  BookingServiceType,
  FoodSource,
  RecurrenceFrequency,
  RecurringBookingInput,
  Client,
  Dog,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";

const SERVICE_TYPES: BookingServiceType[] = ["daycare", "boarding"];

const FOOD_SOURCES: { value: FoodSource; label: string }[] = [
  { value: "own", label: "Own food" },
  { value: "facility", label: "Facility food" },
];

const FREQUENCIES: { value: RecurrenceFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
];

export type BookingFormSubmitPhase = "idle" | "saving";

interface BookingDateRow {
  key: string;
  startDate: string;
  endDate: string;
  arrivalTime: string;
  endTime: string;
}

interface BookingFormProps {
  onSubmit: (data: BookingFormData | BookingFormData[]) => void | Promise<void>;
  onSubmitRecurring?: (data: RecurringBookingInput) => void | Promise<void>;
  submitLabel?: string;
  initialData?: BookingFormData;
  initialClientId?: string | null;
  submitPhase?: BookingFormSubmitPhase;
  lockDates?: boolean;
}

export function BookingForm({
  onSubmit,
  onSubmitRecurring,
  submitLabel = "Create Booking",
  initialData,
  initialClientId = null,
  submitPhase = "idle",
  lockDates = false,
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
      foodSource: null,
      notes: "",
    },
  );
  const [dateRows, setDateRows] = useState<BookingDateRow[]>([
    {
      key: `${rowIdPrefix}-0`,
      startDate: initialData?.startDate ?? "",
      endDate: initialData?.endDate ?? "",
      arrivalTime: initialData?.arrivalTime ?? "",
      endTime: initialData?.endTime ?? "",
    },
  ]);
  const [repeatsEnabled, setRepeatsEnabled] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] =
    useState<RecurrenceFrequency>("weekly");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceEndTouched, setRecurrenceEndTouched] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [dogsLoading, setDogsLoading] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = submitPhase !== "idle";
  const isCreateMode = !initialData;
  const visibleDateRows = repeatsEnabled ? dateRows.slice(0, 1) : dateRows;
  const firstRow = dateRows[0];

  const recurringOccurrences = useMemo(() => {
    if (!repeatsEnabled || !firstRow?.startDate || !recurrenceEndDate) {
      return [];
    }
    if (recurrenceDaysOfWeek.length === 0) return [];

    const firstEndDate =
      form.serviceType === "daycare" ? firstRow.startDate : firstRow.endDate;
    if (!firstEndDate || firstEndDate < firstRow.startDate) return [];

    return enumerateRecurringOccurrences({
      recurrenceStartDate: firstRow.startDate,
      recurrenceEndDate,
      recurrenceFreq,
      recurrenceDaysOfWeek,
      serviceType: form.serviceType,
      endDate: firstEndDate,
    });
  }, [
    repeatsEnabled,
    firstRow?.startDate,
    firstRow?.endDate,
    recurrenceEndDate,
    recurrenceDaysOfWeek,
    recurrenceFreq,
    form.serviceType,
  ]);

  const recurringSummary = useMemo(() => {
    if (!repeatsEnabled) return null;
    return formatRecurringBookingSummary({
      recurrenceFreq,
      recurrenceDaysOfWeek,
      recurrenceEndDate,
      occurrenceCount: recurringOccurrences.length,
    });
  }, [
    repeatsEnabled,
    recurrenceFreq,
    recurrenceDaysOfWeek,
    recurrenceEndDate,
    recurringOccurrences.length,
  ]);

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
    if (!isCreateMode || !form.dogId) return;
    const dog = dogs.find((item) => item.id === form.dogId);
    if (!dog) return;
    setForm((prev) => ({
      ...prev,
      foodSource: dog.feedingSource ?? null,
    }));
  }, [isCreateMode, form.dogId, dogs]);

  useEffect(() => {
    if (!repeatsEnabled || recurrenceEndTouched) return;
    const start = firstRow?.startDate;
    if (!start) return;
    setRecurrenceEndDate(addCalendarMonths(start, 3));
  }, [repeatsEnabled, firstRow?.startDate, recurrenceEndTouched]);

  useEffect(() => {
    if (!isCreateMode) {
      setCapacityWarning(null);
      return;
    }

    if (repeatsEnabled) {
      if (
        recurringOccurrences.length === 0 ||
        recurringOccurrences.length > MAX_RECURRING_OCCURRENCES
      ) {
        setCapacityWarning(null);
        return;
      }

      let cancelled = false;

      async function checkRecurringCapacity() {
        const result = await getRecurringBookingCapacityWarning({
          serviceType: form.serviceType,
          occurrences: recurringOccurrences,
        });
        if (cancelled) return;
        if (result.error) {
          setCapacityWarning(null);
          return;
        }
        setCapacityWarning(result.data);
      }

      void checkRecurringCapacity();

      return () => {
        cancelled = true;
      };
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
  }, [
    isCreateMode,
    form,
    dateRows,
    repeatsEnabled,
    recurringOccurrences,
  ]);

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
    patch: Partial<Pick<BookingDateRow, "startDate" | "endDate" | "arrivalTime" | "endTime">>,
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
        arrivalTime: "",
        endTime: "",
      },
    ]);
  }

  function removeDateRow(key: string) {
    setDateRows((rows) =>
      rows.length <= 1 ? rows : rows.filter((row) => row.key !== key),
    );
  }

  function handleRepeatsToggle(enabled: boolean) {
    setRepeatsEnabled(enabled);
    if (!enabled) return;

    const start = dateRows[0]?.startDate ?? "";
    const weekday = weekdayFromDateString(start);
    setRecurrenceDaysOfWeek(weekday !== null ? [weekday] : []);
    setRecurrenceFreq("weekly");
    setRecurrenceEndTouched(false);
    setRecurrenceEndDate(start ? addCalendarMonths(start, 3) : "");
  }

  function toggleRecurrenceDay(day: number) {
    setRecurrenceDaysOfWeek((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
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

    if (repeatsEnabled) {
      if (!onSubmitRecurring) {
        setFormError("Recurring bookings are not supported here.");
        return;
      }

      const first = dateRows[0];
      const payload: RecurringBookingInput = {
        clientId: form.clientId,
        dogId: form.dogId,
        serviceType: form.serviceType,
        recurrenceFreq,
        recurrenceDaysOfWeek,
        recurrenceStartDate: first.startDate,
        recurrenceEndDate,
        endDate:
          form.serviceType === "daycare" ? first.startDate : first.endDate,
        arrivalTime: first.arrivalTime,
        endTime: first.endTime,
        transportRequired: form.transportRequired,
        foodSource: form.foodSource ?? null,
        notes: form.notes,
      };

      const validationError = validateRecurringBookingInput(payload);
      if (validationError) {
        setFormError(validationError.message);
        return;
      }

      setFormError(null);
      void onSubmitRecurring(payload);
      return;
    }

    const payloads: BookingFormData[] = dateRows.map((row) => ({
      ...form,
      startDate: row.startDate,
      endDate:
        form.serviceType === "daycare" ? row.startDate : row.endDate,
      arrivalTime: row.arrivalTime,
      endTime: row.endTime,
    }));

    for (let index = 0; index < payloads.length; index += 1) {
      const validationError = validateBookingFormData(
        payloads[index],
        payloads.length > 1 ? `Date ${index + 1}` : undefined,
      );
      if (validationError) {
        setFormError(validationError.message);
        return;
      }
    }

    setFormError(null);

    if (payloads.length === 1) {
      void onSubmit(payloads[0]);
      return;
    }

    void onSubmit(payloads);
  }

  function renderDateFields(row: BookingDateRow, index: number) {
    const showRemove = isCreateMode && !repeatsEnabled && index > 0;
    const showRowChrome = !repeatsEnabled && dateRows.length > 1;

    return (
      <div
        key={row.key}
        className={cn(
          "space-y-3",
          showRowChrome &&
            "rounded-xl border border-border bg-surface/40 p-3",
        )}
      >
        {showRowChrome && (
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
          <>
            <Input
              label="Date"
              type="date"
              required
              value={row.startDate}
              onChange={(e) =>
                updateDateRow(row.key, { startDate: e.target.value })
              }
              disabled={isSubmitting || lockDates}
            />
            <Input
              id={`${row.key}-arrival-time`}
              label="Arrival time"
              type="time"
              value={row.arrivalTime}
              onChange={(e) =>
                updateDateRow(row.key, { arrivalTime: e.target.value })
              }
              disabled={isSubmitting}
            />
            <Input
              id={`${row.key}-end-time`}
              label="Expected pickup (optional)"
              type="time"
              labelClassName="text-xs font-medium text-muted-foreground"
              className="h-9 min-h-[36px] text-sm"
              value={row.endTime}
              min={row.arrivalTime || undefined}
              onChange={(e) =>
                updateDateRow(row.key, { endTime: e.target.value })
              }
              disabled={isSubmitting}
            />
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <Input
                label="Start Date"
                type="date"
                required
                value={row.startDate}
                onChange={(e) =>
                  updateDateRow(row.key, { startDate: e.target.value })
                }
                disabled={isSubmitting || lockDates}
              />
              <Input
                id={`${row.key}-arrival-time`}
                label="Arrival time"
                type="time"
                value={row.arrivalTime}
                onChange={(e) =>
                  updateDateRow(row.key, { arrivalTime: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-3">
              <Input
                label="End Date"
                type="date"
                required
                value={row.endDate}
                onChange={(e) =>
                  updateDateRow(row.key, { endDate: e.target.value })
                }
                min={row.startDate || undefined}
                disabled={isSubmitting || lockDates}
              />
              <Input
                id={`${row.key}-end-time`}
                label="Pickup time"
                type="time"
                value={row.endTime}
                min={
                  row.startDate === row.endDate
                    ? row.arrivalTime || undefined
                    : undefined
                }
                onChange={(e) =>
                  updateDateRow(row.key, { endTime: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>
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
            {lockDates && (
              <p className="text-sm text-muted-foreground">
                Date changes aren&apos;t supported for recurring bookings yet
              </p>
            )}
            {visibleDateRows.map((row, index) => renderDateFields(row, index))}

            {isCreateMode && !repeatsEnabled && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={addDateRow}
                className="w-full"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {form.serviceType === "boarding"
                  ? "Add another stay"
                  : "Add another date"}
              </Button>
            )}
          </div>

          {isCreateMode && (
            <div className="space-y-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3">
                <input
                  type="checkbox"
                  checked={repeatsEnabled}
                  disabled={isSubmitting}
                  onChange={(e) => handleRepeatsToggle(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  Repeats
                </span>
              </label>

              {repeatsEnabled && (
                <div className="space-y-4 rounded-xl border border-border bg-surface/40 p-3">
                  <div>
                    <span className="mb-2 block text-sm font-medium text-foreground">
                      Frequency
                    </span>
                    <div className="flex gap-2">
                      {FREQUENCIES.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setRecurrenceFreq(option.value)}
                          className={cn(
                            "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                            recurrenceFreq === option.value
                              ? "border-primary bg-mint-wash text-primary"
                              : "border-border bg-surface text-muted-foreground hover:bg-muted",
                            isSubmitting && "cursor-not-allowed opacity-60",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-medium text-foreground">
                      Days
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_LABELS.map((day) => {
                        const selected = recurrenceDaysOfWeek.includes(
                          day.value,
                        );
                        return (
                          <button
                            key={day.value}
                            type="button"
                            disabled={isSubmitting}
                            aria-pressed={selected}
                            aria-label={day.long}
                            onClick={() => toggleRecurrenceDay(day.value)}
                            className={cn(
                              "flex h-11 min-w-11 items-center justify-center rounded-full border px-2 text-xs font-medium transition-colors",
                              selected
                                ? "border-primary bg-mint-wash text-primary"
                                : "border-border bg-surface text-muted-foreground hover:bg-muted",
                              isSubmitting && "cursor-not-allowed opacity-60",
                            )}
                          >
                            {day.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Input
                    id="booking-recurrence-end"
                    label="Ends on"
                    type="date"
                    required
                    value={recurrenceEndDate}
                    min={firstRow?.startDate || undefined}
                    onChange={(e) => {
                      setRecurrenceEndTouched(true);
                      setRecurrenceEndDate(e.target.value);
                    }}
                    disabled={isSubmitting}
                  />

                  {recurringSummary && (
                    <p className="text-sm text-muted-foreground">
                      {recurringSummary}
                    </p>
                  )}

                  {recurringOccurrences.length > MAX_RECURRING_OCCURRENCES && (
                    <p className="text-sm text-danger">
                      This pattern would create {recurringOccurrences.length}{" "}
                      visits. The maximum is {MAX_RECURRING_OCCURRENCES}.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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

          {isCreateMode && (
            <div>
              <span className="mb-2 block text-sm font-medium text-foreground">
                Food source
              </span>
              <div className="flex gap-2">
                {FOOD_SOURCES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => updateField("foodSource", option.value)}
                    className={cn(
                      "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                      form.foodSource === option.value
                        ? "border-primary bg-mint-wash text-primary"
                        : "border-border bg-surface text-muted-foreground hover:bg-muted",
                      isSubmitting && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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

      {formError && (
        <Alert variant="error">{formError}</Alert>
      )}

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
