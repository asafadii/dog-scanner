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
import { createPortalBooking } from "@/lib/portal/bookings";
import { getPortalDogs } from "@/lib/portal/dogs";
import type { BookingFormData, BookingServiceType, Dog } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const SERVICE_TYPES: BookingServiceType[] = ["daycare", "boarding"];

export default function PortalNewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId || !facilityId) return;

    setError(null);
    setSubmitting(true);

    const result = await createPortalBooking({
      ...form,
      clientId,
      facilityId,
    });

    if (result.error) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    router.push(
      `/portal/bookings/${result.data.id}?clientId=${encodeURIComponent(clientId)}&facilityId=${encodeURIComponent(facilityId)}`,
    );
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
                    onClick={() => setForm({ ...form, serviceType })}
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

            <Input
              label="Start date"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End date"
              type="date"
              required
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />

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
