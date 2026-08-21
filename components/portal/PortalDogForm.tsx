"use client";

import { DogPhotoUpload } from "@/components/dogs/DogPhotoUpload";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getLinkedClients } from "@/lib/portal/auth";
import {
  createPortalDog,
  portalCreateDogInputFromForm,
  updatePortalDog,
  uploadPortalDogPhoto,
} from "@/lib/portal/dogs";
import {
  getDocumentValidationMessage,
  parseVaccinationExpiryDate,
  uploadPortalDocument,
  validateDocumentFile,
  VACCINATION_EXPIRY_REQUIRED_MESSAGE,
} from "@/lib/portal/documents";
import type {
  DogAlerts,
  DogGender,
  DogSize,
  NewDogFormData,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

const SIZES: DogSize[] = ["small", "medium", "large"];
const GENDERS: { value: DogGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
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

export function defaultPortalDogForm(clientId: string): NewDogFormData {
  return {
    name: "",
    breed: "",
    age: "",
    size: "medium",
    gender: null,
    clientId,
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
    vaccinationExpiryDate: "",
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
  const options: {
    key: "yes" | "no" | "unknown";
    label: string;
    next: boolean | null;
  }[] = [
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

export type PortalDogFormMode = "create" | "edit";

interface PortalDogFormProps {
  mode: PortalDogFormMode;
  clientId: string;
  facilityId: string;
  dogId?: string;
  initialData?: NewDogFormData;
  existingPhotoUrl?: string | null;
  submitLabel: string;
  cancelHref: string;
  onSuccess: (dogId: string) => void;
}

export function PortalDogForm({
  mode,
  clientId,
  facilityId,
  dogId,
  initialData,
  existingPhotoUrl,
  submitLabel,
  cancelHref,
  onSuccess,
}: PortalDogFormProps) {
  const [form, setForm] = useState<NewDogFormData>(
    () => initialData ?? defaultPortalDogForm(clientId),
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [vaccinationFiles, setVaccinationFiles] = useState<File[]>([]);
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "saving" | "uploading">("idle");

  useEffect(() => {
    if (mode !== "create") return;

    let cancelled = false;

    void (async () => {
      const result = await getLinkedClients();
      if (cancelled || result.error || !result.data) return;

      const match = result.data.find(
        (client) => client.id === clientId && client.facilityId === facilityId,
      );
      if (!match) return;

      setForm((prev) => ({
        ...prev,
        clientId,
        ownerName: match.name,
        ownerPhone: match.phone ?? "",
        ownerEmail: match.email ?? "",
        ownerAddress: match.address ?? "",
        ownerEmergencyContact: match.emergencyContact ?? "",
        ownerEmergencyPhone: match.emergencyPhone ?? "",
        ownerNotes: match.notes ?? "",
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, clientId, facilityId]);

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
    setDocumentError(null);
    const next = Array.from(files);
    for (const file of next) {
      const validation = validateDocumentFile(file);
      if (!validation.ok) {
        setDocumentError(getDocumentValidationMessage(validation.code));
        return;
      }
    }
    setVaccinationFiles((prev) => [...prev, ...next]);
  }

  function removePendingVaccinationFile(index: number) {
    setVaccinationFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDocumentError(null);

    for (const file of vaccinationFiles) {
      const validation = validateDocumentFile(file);
      if (!validation.ok) {
        setError(getDocumentValidationMessage(validation.code));
        return;
      }
    }

    const uploadExpiry = parseVaccinationExpiryDate(uploadExpiryDate);
    if (vaccinationFiles.length > 0 && !uploadExpiry) {
      setError(VACCINATION_EXPIRY_REQUIRED_MESSAGE);
      return;
    }

    const payload = portalCreateDogInputFromForm(clientId, facilityId, form);
    setPhase("saving");

    let savedDogId = dogId ?? "";

    if (mode === "create") {
      const createResult = await createPortalDog(payload);
      if (createResult.error || !createResult.data) {
        setError(createResult.error?.message ?? "Failed to create dog.");
        setPhase("idle");
        return;
      }
      savedDogId = createResult.data.id;
    } else {
      if (!savedDogId) {
        setError("Missing dog id.");
        setPhase("idle");
        return;
      }
      const updateResult = await updatePortalDog(savedDogId, payload);
      if (updateResult.error || !updateResult.data) {
        setError(updateResult.error?.message ?? "Failed to update dog.");
        setPhase("idle");
        return;
      }
    }

    setPhase("uploading");

    if (photoFile) {
      const uploadResult = await uploadPortalDogPhoto(savedDogId, photoFile);
      if (uploadResult.error) {
        setError(uploadResult.error.message);
        setPhase("idle");
        return;
      }
    }

    for (const file of vaccinationFiles) {
      const uploadResult = await uploadPortalDocument(
        savedDogId,
        file,
        "vaccination",
        uploadExpiry ?? undefined,
      );
      if (uploadResult.error) {
        setError(uploadResult.error.message);
        setPhase("idle");
        return;
      }
    }

    onSuccess(savedDogId);
  }

  const isSubmitting = phase !== "idle";
  const fieldIdPrefix = mode === "edit" ? "portal-edit" : "portal";

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
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted",
                    isSubmitting && "cursor-not-allowed opacity-60",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-foreground">
              Gender
            </span>
            <div className="flex gap-2">
              {GENDERS.map((gender) => (
                <button
                  key={gender.value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => updateField("gender", gender.value)}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                    form.gender === gender.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted",
                    isSubmitting && "cursor-not-allowed opacity-60",
                  )}
                >
                  {gender.label}
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
          <Input
            type="date"
            label="Vaccination expiry date"
            value={form.vaccinationExpiryDate}
            onChange={(e) =>
              updateField("vaccinationExpiryDate", e.target.value)
            }
            hint="When does the current vaccination stamp expire?"
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Section 4 — Owner Information (locked to linked client) */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These details come from your linked owner profile.
          </p>
          <Input label="Owner Name" value={form.ownerName} readOnly disabled />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              type="tel"
              value={form.ownerPhone}
              readOnly
              disabled
            />
            <Input
              label="Email"
              type="email"
              value={form.ownerEmail}
              readOnly
              disabled
            />
          </div>
          <Input
            label="Address"
            value={form.ownerAddress}
            readOnly
            disabled
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Emergency Contact"
              value={form.ownerEmergencyContact}
              readOnly
              disabled
            />
            <Input
              label="Emergency Contact Phone"
              type="tel"
              value={form.ownerEmergencyPhone}
              readOnly
              disabled
            />
          </div>
          {form.ownerNotes ? (
            <Textarea
              label="Notes"
              value={form.ownerNotes}
              rows={3}
              readOnly
              disabled
            />
          ) : null}
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
                  ? "border-primary/40 bg-primary/5"
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
              <span className="text-sm font-medium text-foreground">
                Medication
              </span>
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
                  ? "border-primary/40 bg-primary/5"
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
                ? "border-primary/40 bg-primary/5"
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
            <span className="text-sm font-medium text-foreground">
              Escape Risk
            </span>
          </label>

          <TriStateControl
            label="Separation Anxiety"
            value={form.separationAnxiety}
            onChange={(value) => updateField("separationAnxiety", value)}
            disabled={isSubmitting}
            notes={form.separationAnxietyNotes}
            onNotesChange={(value) =>
              updateField("separationAnxietyNotes", value)
            }
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
            <label
              htmlFor={`${fieldIdPrefix}-meals-per-day`}
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Meals per day: {form.feedingMealsPerDay}
            </label>
            <input
              id={`${fieldIdPrefix}-meals-per-day`}
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

          <Input
            type="date"
            id={`${fieldIdPrefix}-vaccination-upload-expiry`}
            label="New expiry date"
            value={uploadExpiryDate}
            onChange={(e) => setUploadExpiryDate(e.target.value)}
            required={vaccinationFiles.length > 0}
            disabled={isSubmitting}
          />

          <div>
            <label
              htmlFor={`${fieldIdPrefix}-vaccination-upload`}
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Vaccination stamps
            </label>
            <input
              id={`${fieldIdPrefix}-vaccination-upload`}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              multiple
              disabled={isSubmitting}
              onChange={(e) => {
                handleVaccinationFileChange(e.target.files);
                e.target.value = "";
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
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
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {phase === "saving"
            ? mode === "edit"
              ? "Saving changes..."
              : "Creating profile..."
            : phase === "uploading"
              ? "Uploading files..."
              : submitLabel}
        </Button>
        <Link href={cancelHref}>
          <Button type="button" variant="outline" size="lg" className="w-full">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
