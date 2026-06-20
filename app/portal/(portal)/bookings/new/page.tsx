"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createPortalBooking } from "@/lib/portal/bookings";
import { getPortalDogs } from "@/lib/portal/dogs";
import type { BookingFormData, BookingServiceType, Dog } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const SERVICE_TYPES: BookingServiceType[] = ["daycare", "boarding"];

export default function PortalNewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";
  const facilityId = searchParams.get("facilityId") ?? "";
  const initialDogId = searchParams.get("dogId") ?? "";

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loadingDogs, setLoadingDogs] = useState(true);
  const [form, setForm] = useState<BookingFormData>({
    clientId,
    dogId: initialDogId,
    serviceType: "daycare",
    startDate: "",
    endDate: "",
    transportRequired: false,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!clientId || !facilityId) {
      setLoadingDogs(false);
      return;
    }

    void getPortalDogs(clientId, facilityId).then((result) => {
      if (!result.error) {
        setDogs(result.data);
        if (!initialDogId && result.data.length === 1) {
          setForm((current) => ({ ...current, dogId: result.data[0].id }));
        }
      }
      setLoadingDogs(false);
    });
  }, [clientId, facilityId, initialDogId]);

  if (!clientId || !facilityId) {
    return (
      <p className="text-sm text-red-800" role="alert">
        Missing facility context. Go back to the portal and try again.
      </p>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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

    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Book a Stay
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Request daycare or boarding for your dog.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Booking details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <label
                htmlFor="portal-booking-dog"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Dog
              </label>
              <select
                id="portal-booking-dog"
                required
                value={form.dogId}
                disabled={loadingDogs || dogs.length === 0}
                onChange={(e) => setForm({ ...form, dogId: e.target.value })}
                className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
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
                <p className="mt-2 text-sm text-stone-500">
                  Add a dog before creating a booking.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
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
                        ? "border-violet-400 bg-violet-50 text-violet-800"
                        : "border-stone-200 bg-white text-stone-600 hover:border-violet-200",
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

            <label className="flex items-center gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.transportRequired}
                onChange={(e) =>
                  setForm({ ...form, transportRequired: e.target.checked })
                }
                className="h-4 w-4 rounded border-stone-300 text-violet-600 focus:ring-violet-500"
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
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            size="lg"
            disabled={submitting || dogs.length === 0}
          >
            {submitting ? "Submitting..." : "Submit Booking Request"}
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
