"use client";

import { DogPhotoUpload } from "@/components/dogs/DogPhotoUpload";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getClients } from "@/lib/clients";
import {
  deleteStaffDogDocument,
  getStaffDogDocuments,
  getStaffDocumentUrl,
  uploadStaffDogDocument,
} from "@/lib/documents";
import type {
  Client,
  DogAlerts,
  DogDocument,
  DogSize,
  FeedingSource,
  NewDogFormData,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const SIZES: DogSize[] = ["small", "medium", "large"];
const FEEDING_SOURCES: { value: FeedingSource; label: string }[] = [
  { value: "own", label: "Own" },
  { value: "facility", label: "Facility" },
];

const defaultAlerts: DogAlerts = {
  medication: false,
  allergy: false,
  dietary: false,
  aggressionTowardsPeople: false,
  aggressionTowardsDogs: false,
  chewingRisk: false,
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
  ownerAddress: "",
  ownerEmergencyContact: "",
  ownerEmergencyPhone: "",
  ownerNotes: "",
  microchipNumber: "",
  isNeutered: null,
  healthCertificateNumber: "",
  aggressionTowardsPeople: null,
  aggressionTowardsDogs: null,
  separationAnxiety: null,
  kennelTrained: null,
  chewingRisk: null,
  separationAnxietyNotes: "",
  kennelTrainedNotes: "",
  chewingRiskNotes: "",
  aggressionPeopleNotes: "",
  aggressionDogsNotes: "",
  medicationNotes: "",
  allergyNotes: "",
  dietaryNotes: "",
  feedingSource: null,
  feedingMealsPerDay: 2,
  feedingNotes: "",
  behavior: "",
  alerts: { ...defaultAlerts },
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
    ownerAddress: client.address ?? "",
    ownerEmergencyContact: client.emergencyContact ?? "",
    ownerEmergencyPhone: client.emergencyPhone ?? "",
    ownerNotes: client.notes ?? "",
  };
}

function formatDocumentDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

interface TriStateControlProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  disabled?: boolean;
  notes?: string;
  onNotesChange?: (value: string) => void;
  notesPlaceholder?: string;
  showNotesWhen?: "yes" | "never";
}

function TriStateControl({
  label,
  value,
  onChange,
  disabled = false,
  notes,
  onNotesChange,
  notesPlaceholder = "Additional notes",
  showNotesWhen = "yes",
}: TriStateControlProps) {
  const options: { key: "yes" | "no" | "unknown"; label: string; next: boolean | null }[] = [
    { key: "yes", label: "Yes", next: true },
    { key: "no", label: "No", next: false },
    { key: "unknown", label: "Unknown", next: null },
  ];

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.next)}
            className={cn(
              "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              value === option.next
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-muted-foreground hover:bg-muted",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {showNotesWhen === "yes" &&
        value === true &&
        onNotesChange !== undefined && (
          <Textarea
            label="Additional notes"
            value={notes ?? ""}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={notesPlaceholder}
            rows={3}
            disabled={disabled}
          />
        )}
    </div>
  );
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
      {/* Section 1 — Photo */}
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

      {/* Section 2 — Dog Details */}
      <Card>
        <CardHeader>
          <CardTitle>Dog Details</CardTitle>
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
            <span className="mb-2 block text-sm font-medium text-foreground">
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
                      ? "border-primary bg-mint-wash text-primary"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted",
                    isSubmitting && "cursor-not-allowed opacity-60",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Identification */}
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
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3">
            <input
              type="checkbox"
              checked={form.isNeutered === true}
              disabled={isSubmitting}
              onChange={(e) => updateField("isNeutered", e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm font-medium text-foreground">Neutered</span>
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

      {/* Section 4 — Owner Information */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Select
              id="client-select"
              label="Link to Client"
              value={form.clientId ?? ""}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={isSubmitting || clientsLoading}
            >
              <option value="">No client — enter owner manually</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                  {client.phone ? ` (${client.phone})` : ""}
                </option>
              ))}
            </Select>
            {clientsLoading && (
              <p className="mt-1 text-xs text-muted-foreground">Loading clients...</p>
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
          <Input
            label="Address"
            value={form.ownerAddress}
            onChange={(e) => updateField("ownerAddress", e.target.value)}
            placeholder="Street, city, state"
            disabled={isSubmitting}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Emergency Contact"
              value={form.ownerEmergencyContact}
              onChange={(e) => updateField("ownerEmergencyContact", e.target.value)}
              placeholder="Name and relationship"
              disabled={isSubmitting}
            />
            <Input
              label="Emergency Contact Phone"
              type="tel"
              value={form.ownerEmergencyPhone}
              onChange={(e) => updateField("ownerEmergencyPhone", e.target.value)}
              placeholder="(555) 987-6543"
              disabled={isSubmitting}
            />
          </div>
          <Textarea
            label="Notes"
            value={form.ownerNotes}
            onChange={(e) => updateField("ownerNotes", e.target.value)}
            placeholder="Pickup instructions, preferences..."
            rows={3}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Section 5 — Health & Safety */}
      <Card>
        <CardHeader>
          <CardTitle>Health &amp; Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                form.alerts.medication
                  ? "border-primary/40 bg-mint-wash/50"
                  : "border-border hover:bg-muted",
                isSubmitting && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                checked={form.alerts.medication}
                disabled={isSubmitting}
                onChange={() => toggleAlert("medication")}
                className="mt-0.5 h-5 w-5 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">Medication</span>
            </label>
            {form.alerts.medication && (
              <Textarea
                label="What do they take and how is it given?"
                value={form.medicationNotes}
                onChange={(e) => updateField("medicationNotes", e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            )}
          </div>

          <div className="space-y-3">
            <label
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                form.alerts.allergy
                  ? "border-primary/40 bg-mint-wash/50"
                  : "border-border hover:bg-muted",
                isSubmitting && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                checked={form.alerts.allergy}
                disabled={isSubmitting}
                onChange={() => toggleAlert("allergy")}
                className="mt-0.5 h-5 w-5 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">Allergy</span>
            </label>
            {form.alerts.allergy && (
              <Textarea
                label="What are they allergic to?"
                value={form.allergyNotes}
                onChange={(e) => updateField("allergyNotes", e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            )}
          </div>

          <div className="space-y-3">
            <label
              className={cn(
                "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                form.alerts.dietary
                  ? "border-primary/40 bg-mint-wash/50"
                  : "border-border hover:bg-muted",
                isSubmitting && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                checked={form.alerts.dietary}
                disabled={isSubmitting}
                onChange={() => toggleAlert("dietary")}
                className="mt-0.5 h-5 w-5 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">
                Dietary Restriction
              </span>
            </label>
            {form.alerts.dietary && (
              <Textarea
                label="What's the restriction?"
                value={form.dietaryNotes}
                onChange={(e) => updateField("dietaryNotes", e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            )}
          </div>

          <TriStateControl
            label="Aggressive towards people?"
            value={form.aggressionTowardsPeople}
            onChange={(value) => updateField("aggressionTowardsPeople", value)}
            disabled={isSubmitting}
            notes={form.aggressionPeopleNotes}
            onNotesChange={(value) => updateField("aggressionPeopleNotes", value)}
          />

          <TriStateControl
            label="Aggressive towards other dogs?"
            value={form.aggressionTowardsDogs}
            onChange={(value) => updateField("aggressionTowardsDogs", value)}
            disabled={isSubmitting}
            notes={form.aggressionDogsNotes}
            onNotesChange={(value) => updateField("aggressionDogsNotes", value)}
          />

          <label
            className={cn(
              "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
              form.alerts.escapeRisk
                ? "border-primary/40 bg-mint-wash/50"
                : "border-border hover:bg-muted",
              isSubmitting && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="checkbox"
              checked={form.alerts.escapeRisk}
              disabled={isSubmitting}
              onChange={() => toggleAlert("escapeRisk")}
              className="mt-0.5 h-5 w-5 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm font-medium text-foreground">Escape Risk</span>
          </label>

          <TriStateControl
            label="Separation Anxiety"
            value={form.separationAnxiety}
            onChange={(value) => updateField("separationAnxiety", value)}
            disabled={isSubmitting}
            notes={form.separationAnxietyNotes}
            onNotesChange={(value) => updateField("separationAnxietyNotes", value)}
            notesPlaceholder="Triggers, coping strategies..."
          />

          <TriStateControl
            label="Chewing / self-harm risk"
            value={form.chewingRisk}
            onChange={(value) => updateField("chewingRisk", value)}
            disabled={isSubmitting}
            notes={form.chewingRiskNotes}
            onNotesChange={(value) => updateField("chewingRiskNotes", value)}
            notesPlaceholder="e.g. chews bedding and may choke"
          />

          <TriStateControl
            label="Kennel trained"
            value={form.kennelTrained}
            onChange={(value) => updateField("kennelTrained", value)}
            disabled={isSubmitting}
            showNotesWhen="never"
          />
        </CardContent>
      </Card>

      {/* Section 6 — Feeding */}
      <Card>
        <CardHeader>
          <CardTitle>Feeding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="mb-2 block text-sm font-medium text-foreground">
              Own food or facility food?
            </span>
            <div className="flex gap-2">
              {FEEDING_SOURCES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => updateField("feedingSource", value)}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                    form.feedingSource === value
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted",
                    isSubmitting && "cursor-not-allowed opacity-60",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="meals-per-day"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Meals per day: {form.feedingMealsPerDay}
            </label>
            <input
              id="meals-per-day"
              type="range"
              min={1}
              max={3}
              step={1}
              value={form.feedingMealsPerDay}
              disabled={isSubmitting}
              onChange={(e) =>
                updateField(
                  "feedingMealsPerDay",
                  Number(e.target.value) as 1 | 2 | 3,
                )
              }
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>2</span>
              <span>3</span>
            </div>
          </div>
          <Textarea
            label="Additional details"
            value={form.feedingNotes}
            onChange={(e) => updateField("feedingNotes", e.target.value)}
            placeholder="Feeding schedule, brand, portion sizes..."
            rows={3}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Section 7 — Other Behavioural Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Other Behavioural Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            label="Other Behavioural Notes"
            value={form.behavior}
            onChange={(e) => updateField("behavior", e.target.value)}
            placeholder="Temperament, triggers, play preferences..."
            rows={4}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Section 8 — Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload vaccination stamps (JPG, PNG, or PDF). You can add multiple
            files.
          </p>

          {documentError && (
            <p className="text-sm text-danger" role="alert">
              {documentError}
            </p>
          )}

          {dogId && documentsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading documents...
            </div>
          ) : (
            existingDocuments.length > 0 && (
              <ul className="space-y-2">
                {existingDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => void handleOpenDocument(doc.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-foreground hover:text-primary"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        Vaccination stamp · {formatDocumentDate(doc.createdAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDocument(doc.id)}
                      disabled={deletingDocumentId === doc.id || isSubmitting}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-danger hover:bg-danger/10 disabled:opacity-50"
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
                className="mb-2 block text-sm font-medium text-foreground"
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
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-mint-wash file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
              />
            </div>
          )}

          {!dogId && (
            <div>
              <label
                htmlFor="vaccination-upload-new"
                className="mb-2 block text-sm font-medium text-foreground"
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
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-mint-wash file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
              />
              {vaccinationFiles.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {vaccinationFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                    >
                      <span className="truncate text-foreground">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removePendingVaccinationFile(index)}
                        disabled={isSubmitting}
                        className="text-danger hover:text-danger/80"
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
