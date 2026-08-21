"use client";

import {
  buildFacilityOptions,
  PortalFacilityPicker,
  type FacilityOption,
} from "@/components/portal/PortalFacilityPicker";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  validateBookingFormData,
  validateRecurringBookingInput,
} from "@/lib/bookings";
import { getLinkedClients } from "@/lib/portal/auth";
import {
  createPortalBooking,
  createPortalBookings,
  createPortalRecurringBooking,
} from "@/lib/portal/bookings";
import { getPortalDogs } from "@/lib/portal/dogs";
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
  Dog,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

interface BookingDateRow {
  key: string;
  startDate: string;
  endDate: string;
  arrivalTime: string;
  endTime: string;
}

export default function PortalNewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rowIdPrefix = useId();
  const initialClientId = searchParams.get("clientId") ?? "";
  const initialFacilityId = searchParams.get("facilityId") ?? "";
  const initialDogId = searchParams.get("dogId") ?? "";

  const [facilityOptions, setFacilityOptions] = useState<FacilityOption[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<FacilityOption | null>(
    null,
  );
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loadingDogs, setLoadingDogs] = useState(true);
  const [form, setForm] = useState<BookingFormData>({
    clientId: initialClientId,
    dogId: initialDogId,
    serviceType: "daycare",
    startDate: "",
    endDate: "",
    transportRequired: false,
    foodSource: null,
    notes: "",
  });
  const [dateRows, setDateRows] = useState<BookingDateRow[]>([
    { key: `${rowIdPrefix}-0`, startDate: "", endDate: "", arrivalTime: "", endTime: "" },
  ]);
  const [repeatsEnabled, setRepeatsEnabled] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] =
    useState<RecurrenceFrequency>("weekly");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceEndTouched, setRecurrenceEndTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  const clientId = selectedFacility?.clientId ?? "";
  const facilityId = selectedFacility?.facilityId ?? "";
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
    void getLinkedClients().then((result) => {
      if (result.error) {
        setContextError(result.error.message);
        setLoadingDogs(false);
        return;
      }

      const options = buildFacilityOptions(result.data);
      setFacilityOptions(options);

      const matched =
        options.find(
          (option) =>
            option.facilityId === initialFacilityId &&
            option.clientId === initialClientId,
        ) ??
        options.find((option) => option.facilityId === initialFacilityId) ??
        options[0] ??
        null;

      setSelectedFacility(matched);
      if (!matched) {
        setContextError(
          "Missing facility context. Go back to the portal and try again.",
        );
        setLoadingDogs(false);
      }
    });
  }, [initialClientId, initialFacilityId]);

  useEffect(() => {
    if (!clientId || !facilityId) {
      return;
    }

    setLoadingDogs(true);
    setForm((current) => ({
      ...current,
      clientId,
      dogId: current.clientId === clientId ? current.dogId : initialDogId,
    }));

    void getPortalDogs(clientId, facilityId).then((result) => {
      if (!result.error) {
        setDogs(result.data);
        setForm((current) => {
          const keepDog =
            current.dogId &&
            result.data.some((dog) => dog.id === current.dogId);
          const nextDogId = keepDog
            ? current.dogId
            : !initialDogId && result.data.length === 1
              ? result.data[0].id
              : initialDogId &&
                  result.data.some((dog) => dog.id === initialDogId)
                ? initialDogId
                : "";
          const selected = result.data.find((dog) => dog.id === nextDogId);
          return {
            ...current,
            dogId: nextDogId,
            foodSource: selected?.feedingSource ?? null,
          };
        });
      } else {
        setDogs([]);
      }
      setLoadingDogs(false);
    });
  }, [clientId, facilityId, initialDogId]);

  useEffect(() => {
    if (!repeatsEnabled || recurrenceEndTouched) return;
    const start = firstRow?.startDate;
    if (!start) return;
    setRecurrenceEndDate(addCalendarMonths(start, 3));
  }, [repeatsEnabled, firstRow?.startDate, recurrenceEndTouched]);

  const pickerOptions = useMemo(() => facilityOptions, [facilityOptions]);

  if (contextError && !selectedFacility) {
    return (
      <p className="text-sm text-danger" role="alert">
        {contextError}
      </p>
    );
  }

  function handleServiceTypeChange(serviceType: BookingServiceType) {
    setForm((current) => ({
      ...current,
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId || !facilityId) return;

    setError(null);
    setSubmitting(true);

    if (repeatsEnabled) {
      const first = dateRows[0];
      const payload: RecurringBookingInput & { facilityId: string } = {
        clientId,
        facilityId,
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
        setError(validationError.message);
        setSubmitting(false);
        return;
      }

      const result = await createPortalRecurringBooking(payload);
      if (result.error) {
        setError(result.error.message);
        setSubmitting(false);
        return;
      }

      router.push("/portal");
      router.refresh();
      return;
    }

    const payloads = dateRows.map((row) => ({
      ...form,
      startDate: row.startDate,
      endDate:
        form.serviceType === "daycare" ? row.startDate : row.endDate,
      arrivalTime: row.arrivalTime,
      endTime: row.endTime,
      clientId,
      facilityId,
    }));

    for (let index = 0; index < payloads.length; index += 1) {
      const validationError = validateBookingFormData(
        payloads[index],
        payloads.length > 1 ? `Date ${index + 1}` : undefined,
      );
      if (validationError) {
        setError(validationError.message);
        setSubmitting(false);
        return;
      }
    }

    if (payloads.length === 1) {
      const result = await createPortalBooking(payloads[0]);
      if (result.error) {
        setError(result.error.message);
        setSubmitting(false);
        return;
      }

      router.push(
        `/portal/bookings/${result.data.id}?clientId=${encodeURIComponent(clientId)}&facilityId=${encodeURIComponent(facilityId)}`,
      );
      router.refresh();
      return;
    }

    const result = await createPortalBookings(payloads);
    if (result.error) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Book a Stay
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Request daycare or boarding for your dog.
        </p>
      </div>

      <PortalFacilityPicker
        options={pickerOptions}
        selectedFacilityId={selectedFacility?.facilityId ?? ""}
        onChange={(option) => {
          setSelectedFacility(option);
          setForm((current) => ({
            ...current,
            clientId: option.clientId,
            dogId: "",
          }));
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Booking details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <label
                htmlFor="portal-booking-dog"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Dog
              </label>
              <select
                id="portal-booking-dog"
                required
                value={form.dogId}
                disabled={loadingDogs || dogs.length === 0}
                onChange={(e) => {
                  const dogId = e.target.value;
                  const selected = dogs.find((dog) => dog.id === dogId);
                  setForm({
                    ...form,
                    dogId,
                    foodSource: selected?.feedingSource ?? null,
                  });
                }}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">
                  {loadingDogs ? "Loading dogs..." : "Select a dog"}
                </option>
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name} ({dog.breed})
                  </option>
                ))}
              </select>
              {!loadingDogs && dogs.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a dog before creating a booking.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Service type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPES.map((serviceType) => (
                  <button
                    key={serviceType}
                    type="button"
                    onClick={() => handleServiceTypeChange(serviceType)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm capitalize transition-colors",
                      form.serviceType === serviceType
                        ? "border-primary bg-[#EAF4F1] text-primary"
                        : "border-border bg-surface text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {serviceType}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {visibleDateRows.map((row, index) => {
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
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeDateRow(row.key)}
                          disabled={submitting}
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
                      />
                      <Input
                        id={`${row.key}-arrival-time`}
                        label="Arrival time"
                        type="time"
                        value={row.arrivalTime}
                        onChange={(e) =>
                          updateDateRow(row.key, { arrivalTime: e.target.value })
                        }
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
                      />
                    </>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-3">
                        <Input
                          label="Start date"
                          type="date"
                          required
                          value={row.startDate}
                          onChange={(e) =>
                            updateDateRow(row.key, { startDate: e.target.value })
                          }
                        />
                        <Input
                          id={`${row.key}-arrival-time`}
                          label="Arrival time"
                          type="time"
                          value={row.arrivalTime}
                          onChange={(e) =>
                            updateDateRow(row.key, { arrivalTime: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-3">
                        <Input
                          label="End date"
                          type="date"
                          required
                          value={row.endDate}
                          min={row.startDate || undefined}
                          onChange={(e) =>
                            updateDateRow(row.key, { endDate: e.target.value })
                          }
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
                        />
                      </div>
                    </div>
                  )}
                </div>
                );
              })}

              {!repeatsEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
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

            <div className="space-y-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3">
                <input
                  type="checkbox"
                  checked={repeatsEnabled}
                  disabled={submitting}
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
                          disabled={submitting}
                          onClick={() => setRecurrenceFreq(option.value)}
                          className={cn(
                            "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                            recurrenceFreq === option.value
                              ? "border-primary bg-mint-wash text-primary"
                              : "border-border bg-surface text-muted-foreground hover:bg-muted",
                            submitting && "cursor-not-allowed opacity-60",
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
                            disabled={submitting}
                            aria-pressed={selected}
                            aria-label={day.long}
                            onClick={() => toggleRecurrenceDay(day.value)}
                            className={cn(
                              "flex h-11 min-w-11 items-center justify-center rounded-full border px-2 text-xs font-medium transition-colors",
                              selected
                                ? "border-primary bg-mint-wash text-primary"
                                : "border-border bg-surface text-muted-foreground hover:bg-muted",
                              submitting && "cursor-not-allowed opacity-60",
                            )}
                          >
                            {day.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Input
                    id="portal-booking-recurrence-end"
                    label="Ends on"
                    type="date"
                    required
                    value={recurrenceEndDate}
                    min={firstRow?.startDate || undefined}
                    onChange={(e) => {
                      setRecurrenceEndTouched(true);
                      setRecurrenceEndDate(e.target.value);
                    }}
                    disabled={submitting}
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

            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.transportRequired}
                onChange={(e) =>
                  setForm({ ...form, transportRequired: e.target.checked })
                }
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Transport required
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium text-foreground">
                Food source
              </span>
              <div className="flex gap-2">
                {FOOD_SOURCES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, foodSource: option.value })
                    }
                    className={cn(
                      "min-h-[44px] flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      form.foodSource === option.value
                        ? "border-primary bg-mint-wash text-primary"
                        : "border-border bg-surface text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything we should know for this stay?"
            />
          </CardContent>
        </Card>

        {error && (
          <p
            className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}

        {selectedFacility ? (
          <p className="text-sm text-muted-foreground">
            Booking for:{" "}
            <span className="font-medium text-foreground">
              {selectedFacility.facilityName}
            </span>
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            size="lg"
            disabled={submitting || dogs.length === 0 || !selectedFacility}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
          <Link href="/portal">
            <Button type="button" variant="outline" size="lg" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
