"use client";

import { DogPhotoUpload } from "@/components/dogs/DogPhotoUpload";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getClients } from "@/lib/clients";
import {
  deleteStaffDogDocument,
  getStaffDogDocuments,
  getStaffDocumentUrl,
  uploadStaffDogDocument,
} from "@/lib/documents";
import type { Client, DogAlerts, DogDocument, DogSize, NewDogFormData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FileText, Loader2, Trash2 } from "lucide-react";
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

const defaultForm: NewDogFormData = {
  name: "",
  breed: "",
  age: "",
  size: "medium",
  clientId: null,
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  microchipNumber: "",
  isNeutered: null,
  healthCertificateNumber: "",
  aggressionTowardsPeople: null,
  aggressionTowardsDogs: null,
  separationAnxiety: "",
  kennelTrained: "",
  chewingRisk: "",
  medication: "",
  feeding: "",
  allergies: "",
  behavior: "",
  alerts: { ...defaultAlerts },
  overnight: false,
};

export type DogFormSubmitPhase = "idle" | "uploading" | "saving";

interface DogFormProps {
  onSubmit: (
    data: NewDogFormData,
    photo?: File | null,
    vaccinationFiles?: File[],
  ) => void | Promise<void>;
  submitLabel?: string;
  initialData?: NewDogFormData;
  initialClientId?: string | null;
  existingPhotoUrl?: string | null;
  submitPhase?: DogFormSubmitPhase;
  dogId?: string;
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

function formatDocumentDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function DogForm({
  onSubmit,
  submitLabel = "Create Dog Profile",
  initialData,
  initialClientId = null,
  existingPhotoUrl,
  submitPhase = "idle",
  dogId,
}: DogFormProps) {
  const [form, setForm] = useState<NewDogFormData>(
    initialData ?? { ...defaultForm, clientId: initialClientId },
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [vaccinationFiles, setVaccinationFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<DogDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!dogId) return;

    const currentDogId = dogId;
    let cancelled = false;

    async function loadDocuments() {
      setDocumentsLoading(true);
      const result = await getStaffDogDocuments(currentDogId);
      if (cancelled) return;

      if (result.error) {
        setDocumentError(result.error.message);
        setExistingDocuments([]);
      } else {
        setExistingDocuments(result.data);
        setDocumentError(null);
      }

      setDocumentsLoading(false);
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [dogId]);

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

  function handleVaccinationFileChange(files: FileList | null) {
    if (!files?.length) return;
    setVaccinationFiles((prev) => [...prev, ...Array.from(files)]);
  }

  function removePendingVaccinationFile(index: number) {
    setVaccinationFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDeleteDocument(documentId: string) {
    setDeletingDocumentId(documentId);
    setDocumentError(null);

    const result = await deleteStaffDogDocument(documentId);
    if (result.error) {
      setDocumentError(result.error.message);
    } else {
      setExistingDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    }

    setDeletingDocumentId(null);
  }

  async function handleOpenDocument(documentId: string) {
    const result = await getStaffDocumentUrl(documentId);
    if (result.error) {
      setDocumentError(result.error.message);
      return;
    }
    window.open(result.data, "_blank", "noopener,noreferrer");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    void onSubmit(form, photoFile, vaccinationFiles);
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
                      ? "border-[oklch(0.531_0.092_185.0)] bg-[#F0FAF9] text-[oklch(0.420_0.075_185.0)]"
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
              className="h-5 w-5 rounded border-stone-300 text-[oklch(0.531_0.092_185.0)] focus:ring-[oklch(0.531_0.092_185.0)]"
            />
            <span className="text-sm font-medium text-stone-700">
              Overnight boarding stay
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Microchip number"
            value={form.microchipNumber}
            onChange={(e) => updateField("microchipNumber", e.target.value)}
            placeholder="e.g. 985112345678901"
            disabled={isSubmitting}
          />
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.isNeutered === true}
              disabled={isSubmitting}
              onChange={(e) => updateField("isNeutered", e.target.checked)}
              className="h-5 w-5 rounded border-stone-300 text-[oklch(0.531_0.092_185.0)] focus:ring-[oklch(0.531_0.092_185.0)]"
            />
            <span className="text-sm font-medium text-stone-700">Neutered</span>
          </label>
          <Input
            label="Health certificate number"
            value={form.healthCertificateNumber}
            onChange={(e) =>
              updateField("healthCertificateNumber", e.target.value)
            }
            placeholder="Certificate or passport number"
            disabled={isSubmitting}
          />
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
                "focus:border-[oklch(0.531_0.092_185.0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.531_0.092_185.0)]/20",
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
                  ? "border-[oklch(0.900_0.035_185.0)] bg-[#F0FAF9]/50"
                  : "border-stone-200 hover:bg-stone-50",
                isSubmitting && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                checked={form.alerts[key]}
                disabled={isSubmitting}
                onChange={() => toggleAlert(key)}
                className="mt-0.5 h-5 w-5 rounded border-stone-300 text-[oklch(0.531_0.092_185.0)] focus:ring-[oklch(0.531_0.092_185.0)]"
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
          <CardTitle>Behaviour &amp; Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.aggressionTowardsPeople === true}
              disabled={isSubmitting}
              onChange={(e) =>
                updateField("aggressionTowardsPeople", e.target.checked)
              }
              className="h-5 w-5 rounded border-stone-300 text-[oklch(0.531_0.092_185.0)] focus:ring-[oklch(0.531_0.092_185.0)]"
            />
            <span className="text-sm font-medium text-stone-700">
              Aggressive towards people?
            </span>
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.aggressionTowardsDogs === true}
              disabled={isSubmitting}
              onChange={(e) =>
                updateField("aggressionTowardsDogs", e.target.checked)
              }
              className="h-5 w-5 rounded border-stone-300 text-[oklch(0.531_0.092_185.0)] focus:ring-[oklch(0.531_0.092_185.0)]"
            />
            <span className="text-sm font-medium text-stone-700">
              Aggressive towards other dogs?
            </span>
          </label>
          <Textarea
            label="Separation anxiety"
            value={form.separationAnxiety}
            onChange={(e) => updateField("separationAnxiety", e.target.value)}
            placeholder="Triggers, coping strategies..."
            rows={3}
            disabled={isSubmitting}
          />
          <Textarea
            label="Kennel trained"
            value={form.kennelTrained}
            onChange={(e) => updateField("kennelTrained", e.target.value)}
            placeholder="Comfort in crates or kennels..."
            rows={3}
            disabled={isSubmitting}
          />
          <Textarea
            label="Chewing / self-harm risk"
            value={form.chewingRisk}
            onChange={(e) => updateField("chewingRisk", e.target.value)}
            placeholder="e.g. chews bedding and may choke"
            rows={3}
            disabled={isSubmitting}
          />
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

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-stone-500">
            Upload vaccination stamps (JPG, PNG, or PDF). You can add multiple
            files.
          </p>

          {documentError && (
            <p className="text-sm text-red-700" role="alert">
              {documentError}
            </p>
          )}

          {dogId && documentsLoading ? (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading documents...
            </div>
          ) : (
            existingDocuments.length > 0 && (
              <ul className="space-y-2">
                {existingDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => void handleOpenDocument(doc.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-stone-800 hover:text-[oklch(0.420_0.075_185.0)]"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-stone-400" />
                      <span className="truncate">
                        Vaccination stamp · {formatDocumentDate(doc.createdAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDocument(doc.id)}
                      disabled={deletingDocumentId === doc.id || isSubmitting}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label="Delete vaccination document"
                    >
                      {deletingDocumentId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}

          {dogId && (
            <div>
              <label
                htmlFor="vaccination-upload-edit"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Add vaccination stamps
              </label>
              <input
                id="vaccination-upload-edit"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                multiple
                disabled={isSubmitting}
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files?.length) return;
                  setDocumentError(null);
                  for (const file of Array.from(files)) {
                    const result = await uploadStaffDogDocument(
                      dogId,
                      file,
                      "vaccination",
                    );
                    if (result.error) {
                      setDocumentError(result.error.message);
                    } else {
                      setExistingDocuments((prev) => [result.data, ...prev]);
                    }
                  }
                  e.target.value = "";
                }}
                className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#F0FAF9] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[oklch(0.420_0.075_185.0)]"
              />
            </div>
          )}

          {!dogId && (
            <div>
              <label
                htmlFor="vaccination-upload-new"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Vaccination stamps
              </label>
              <input
                id="vaccination-upload-new"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                multiple
                disabled={isSubmitting}
                onChange={(e) => handleVaccinationFileChange(e.target.files)}
                className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#F0FAF9] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[oklch(0.420_0.075_185.0)]"
              />
              {vaccinationFiles.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {vaccinationFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2 text-sm"
                    >
                      <span className="truncate text-stone-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removePendingVaccinationFile(index)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`Remove ${file.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
