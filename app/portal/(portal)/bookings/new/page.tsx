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
import { getLinkedClients } from "@/lib/portal/auth";
import {
  createPortalBooking,
  createPortalBookings,
} from "@/lib/portal/bookings";
import { getPortalDogs } from "@/lib/portal/dogs";
import type { BookingFormData, BookingServiceType, Dog } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";

const SERVICE_TYPES: BookingServiceType[] = ["daycare", "boarding"];

interface BookingDateRow {
  key: string;
  startDate: string;
  endDate: string;
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
    notes: "",
  });
  const [dateRows, setDateRows] = useState<BookingDateRow[]>([
    { key: `${rowIdPrefix}-0`, startDate: "", endDate: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  const clientId = selectedFacility?.clientId ?? "";
  const facilityId = selectedFacility?.facilityId ?? "";

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
          if (keepDog) return current;
          if (!initialDogId && result.data.length === 1) {
            return { ...current, dogId: result.data[0].id };
          }
          if (
            initialDogId &&
            result.data.some((dog) => dog.id === initialDogId)
          ) {
            return { ...current, dogId: initialDogId };
          }
          return { ...current, dogId: "" };
        });
      } else {
        setDogs([]);
      }
      setLoadingDogs(false);
    });
  }, [clientId, facilityId, initialDogId]);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId || !facilityId) return;

    setError(null);
    setSubmitting(true);

    const payloads = dateRows.map((row) => ({
      ...form,
      startDate: row.startDate,
      endDate:
        form.serviceType === "daycare" ? row.startDate : row.endDate,
      clientId,
      facilityId,
    }));

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
                onChange={(e) => setForm({ ...form, dogId: e.target.value })}
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
              {dateRows.map((row, index) => (
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
                    <Input
                      label="Date"
                      type="date"
                      required
                      value={row.startDate}
                      onChange={(e) =>
                        updateDateRow(row.key, { startDate: e.target.value })
                      }
                    />
                  ) : (
                    <>
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
                        label="End date"
                        type="date"
                        required
                        value={row.endDate}
                        min={row.startDate || undefined}
                        onChange={(e) =>
                          updateDateRow(row.key, { endDate: e.target.value })
                        }
                      />
                    </>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={addDateRow}
                className="w-full"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add another date
              </Button>
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
