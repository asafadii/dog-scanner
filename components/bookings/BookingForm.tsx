"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getClientDogs, getClients } from "@/lib/clients";
import { getBookingCapacityWarning } from "@/lib/capacity";
import type { BookingFormData, BookingServiceType, Client, Dog } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const SERVICE_TYPES: BookingServiceType[] = ["daycare", "boarding"];

export type BookingFormSubmitPhase = "idle" | "saving";

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void | Promise<void>;
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

    if (
      !form.startDate ||
      !form.endDate ||
      form.endDate < form.startDate
    ) {
      setCapacityWarning(null);
      return;
    }

    let cancelled = false;

    async function checkCapacity() {
      const result = await getBookingCapacityWarning(form);
      if (cancelled) return;
      setCapacityWarning(result.error ? null : result.data);
    }

    void checkCapacity();

    return () => {
      cancelled = true;
    };
  }, [isCreateMode, form.serviceType, form.startDate, form.endDate]);

  function updateField<K extends keyof BookingFormData>(
    key: K,
    value: BookingFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    void onSubmit(form);
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
              className="mb-2 block text-sm font-medium text-stone-700"
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
                "min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900",
                "focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20",
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
              className="mb-2 block text-sm font-medium text-stone-700"
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
                "min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900",
                "focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20",
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
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Service Type
            </span>
            <div className="flex gap-2">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => updateField("serviceType", type)}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-colors",
                    form.serviceType === type
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                    isSubmitting && "cursor-not-allowed opacity-60",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={form.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
              min={form.startDate || undefined}
              disabled={isSubmitting}
            />
          </div>

          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.transportRequired}
              disabled={isSubmitting}
              onChange={(e) =>
                updateField("transportRequired", e.target.checked)
              }
              className="h-5 w-5 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-stone-700">
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
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          {capacityWarning}
        </div>
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
