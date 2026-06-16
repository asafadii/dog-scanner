"use client";

import { DogPhotoUpload } from "@/components/dogs/DogPhotoUpload";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getClients } from "@/lib/clients";
import type { Client, DogAlerts, DogSize, NewDogFormData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const SIZES: DogSize[] = ["small", "medium", "large"];

const ALERT_FIELDS: {
  key: keyof DogAlerts;
  label: string;
  description: string;
}[] = [
  { key: "medication", label: "Medication", description: "Requires medication during stay" },
  { key: "allergy", label: "Allergy", description: "Has known allergies" },
  { key: "dietary", label: "Dietary Restriction", description: "Special feeding requirements" },
  { key: "aggression", label: "Aggression Caution", description: "May be reactive to dogs or people" },
  { key: "escapeRisk", label: "Escape Risk", description: "Known to jump fences or bolt" },
];

const defaultAlerts: DogAlerts = {
  medication: false,
  allergy: false,
  dietary: false,
  aggression: false,
  escapeRisk: false,
};

export type DogFormSubmitPhase = "idle" | "uploading" | "saving";

interface DogFormProps {
  onSubmit: (data: NewDogFormData, photo?: File | null) => void | Promise<void>;
  submitLabel?: string;
  initialData?: NewDogFormData;
  initialClientId?: string | null;
  existingPhotoUrl?: string | null;
  submitPhase?: DogFormSubmitPhase;
}

function applyClientToOwnerFields(
  client: Client,
  current: NewDogFormData,
): NewDogFormData {
  return {
    ...current,
    clientId: client.id,
    ownerName: client.name,
    ownerPhone: client.phone ?? "",
    ownerEmail: client.email ?? "",
  };
}

export function DogForm({
  onSubmit,
  submitLabel = "Create Dog Profile",
  initialData,
  initialClientId = null,
  existingPhotoUrl,
  submitPhase = "idle",
}: DogFormProps) {
  const [form, setForm] = useState<NewDogFormData>(
    initialData ?? {
      name: "",
      breed: "",
      age: "",
      size: "medium",
      clientId: initialClientId,
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      medication: "",
      feeding: "",
      allergies: "",
      behavior: "",
      alerts: { ...defaultAlerts },
      overnight: false,
    },
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const isSubmitting = submitPhase !== "idle";

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      setClientsLoading(true);
      const result = await getClients();
      if (cancelled) return;

      if (!result.error) {
        setClients(result.data);

        if (initialClientId && !initialData) {
          const client = result.data.find((item) => item.id === initialClientId);
          if (client) {
            setForm((prev) => applyClientToOwnerFields(client, prev));
          }
        }
      }

      setClientsLoading(false);
    }

    void loadClients();

    return () => {
      cancelled = true;
    };
  }, [initialClientId, initialData]);

  function handleClientChange(clientId: string) {
    if (!clientId) {
      setForm((prev) => ({ ...prev, clientId: null }));
      return;
    }

    const client = clients.find((item) => item.id === clientId);
    if (!client) return;

    setForm((prev) => applyClientToOwnerFields(client, prev));
  }

  function updateField<K extends keyof NewDogFormData>(
    key: K,
    value: NewDogFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAlert(key: keyof DogAlerts) {
    setForm((prev) => ({
      ...prev,
      alerts: { ...prev.alerts, [key]: !prev.alerts[key] },
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    void onSubmit(form, photoFile);
  }

  const buttonLabel =
    submitPhase === "uploading"
      ? "Uploading..."
      : submitPhase === "saving"
        ? "Saving..."
        : submitLabel;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <DogPhotoUpload
            existingPhotoUrl={existingPhotoUrl}
            dogName={form.name || "Dog"}
            onFileChange={setPhotoFile}
            onError={setPhotoError}
            error={photoError}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dog Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Dog Name"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Max"
            disabled={isSubmitting}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Breed"
              required
              value={form.breed}
              onChange={(e) => updateField("breed", e.target.value)}
              placeholder="e.g. Golden Retriever"
              disabled={isSubmitting}
            />
            <Input
              label="Age"
              required
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
              placeholder="e.g. 3 years"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Size
            </span>
            <div className="flex gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => updateField("size", size)}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-colors",
                    form.size === size
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                    isSubmitting && "cursor-not-allowed opacity-60",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.overnight}
              disabled={isSubmitting}
              onChange={(e) => updateField("overnight", e.target.checked)}
              className="h-5 w-5 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-stone-700">
              Overnight boarding stay
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="client-select"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Link to Client
            </label>
            <select
              id="client-select"
              value={form.clientId ?? ""}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={isSubmitting || clientsLoading}
              className={cn(
                "min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900",
                "focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20",
                (isSubmitting || clientsLoading) && "cursor-not-allowed opacity-60",
              )}
            >
              <option value="">No client — enter owner manually</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                  {client.phone ? ` (${client.phone})` : ""}
                </option>
              ))}
            </select>
            {clientsLoading && (
              <p className="mt-1 text-xs text-stone-500">Loading clients...</p>
            )}
          </div>
          <Input
            label="Owner Name"
            required
            value={form.ownerName}
            onChange={(e) => updateField("ownerName", e.target.value)}
            disabled={isSubmitting}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              type="tel"
              required
              value={form.ownerPhone}
              onChange={(e) => updateField("ownerPhone", e.target.value)}
              placeholder="(555) 123-4567"
              disabled={isSubmitting}
            />
            <Input
              label="Email"
              type="email"
              value={form.ownerEmail}
              onChange={(e) => updateField("ownerEmail", e.target.value)}
              placeholder="owner@email.com"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Care Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ALERT_FIELDS.map(({ key, label, description }) => (
            <label
              key={key}
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                form.alerts[key]
                  ? "border-teal-200 bg-teal-50/50"
                  : "border-stone-200 hover:bg-stone-50",
                isSubmitting && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                checked={form.alerts[key]}
                disabled={isSubmitting}
                onChange={() => toggleAlert(key)}
                className="mt-0.5 h-5 w-5 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="text-sm font-medium text-stone-800">
                  {label}
                </span>
                <p className="text-xs text-stone-500">{description}</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Care Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Medication"
            value={form.medication}
            onChange={(e) => updateField("medication", e.target.value)}
            placeholder="Medication schedule and dosage..."
            rows={3}
            disabled={isSubmitting}
          />
          <Textarea
            label="Feeding"
            value={form.feeding}
            onChange={(e) => updateField("feeding", e.target.value)}
            placeholder="Feeding schedule and dietary notes..."
            rows={3}
            disabled={isSubmitting}
          />
          <Textarea
            label="Allergies"
            value={form.allergies}
            onChange={(e) => updateField("allergies", e.target.value)}
            placeholder="Known allergies..."
            rows={2}
            disabled={isSubmitting}
          />
          <Textarea
            label="Behavior Notes"
            value={form.behavior}
            onChange={(e) => updateField("behavior", e.target.value)}
            placeholder="Temperament, triggers, play preferences..."
            rows={3}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        )}
        {buttonLabel}
      </Button>
    </form>
  );
}
