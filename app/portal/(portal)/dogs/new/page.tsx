"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  createPortalDog,
  portalCreateDogInputFromForm,
} from "@/lib/portal/dogs";
import {
  getDocumentValidationMessage,
  uploadPortalDocument,
  validateDocumentFile,
} from "@/lib/portal/documents";
import type { DogAlerts, DogDocumentType, DogSize, NewDogFormData } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

const SIZES: DogSize[] = ["small", "medium", "large"];
const DOCUMENT_TYPES: { value: DogDocumentType; label: string }[] = [
  { value: "vaccination", label: "Vaccination record" },
  { value: "pedigree", label: "Pedigree" },
  { value: "other", label: "Other" },
];

const defaultAlerts: DogAlerts = {
  medication: false,
  allergy: false,
  dietary: false,
  aggression: false,
  escapeRisk: false,
};

export default function PortalNewDogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";
  const facilityId = searchParams.get("facilityId") ?? "";

  const [form, setForm] = useState<NewDogFormData>({
    name: "",
    breed: "",
    age: "",
    size: "medium",
    clientId,
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    medication: "",
    feeding: "",
    allergies: "",
    behavior: "",
    alerts: { ...defaultAlerts },
    overnight: false,
  });
  const [vaccinationFile, setVaccinationFile] = useState<File | null>(null);
  const [optionalFile, setOptionalFile] = useState<File | null>(null);
  const [optionalDocType, setOptionalDocType] = useState<DogDocumentType>("pedigree");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "creating" | "uploading">("idle");

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

    if (vaccinationFile) {
      const validation = validateDocumentFile(vaccinationFile);
      if (!validation.ok) {
        setError(getDocumentValidationMessage(validation.code));
        return;
      }
    }

    if (optionalFile) {
      const validation = validateDocumentFile(optionalFile);
      if (!validation.ok) {
        setError(getDocumentValidationMessage(validation.code));
        return;
      }
    }

    setPhase("creating");
    const createResult = await createPortalDog(
      portalCreateDogInputFromForm(clientId, facilityId, form),
    );

    if (createResult.error || !createResult.data) {
      setError(createResult.error?.message ?? "Failed to create dog.");
      setPhase("idle");
      return;
    }

    const dogId = createResult.data.id;
    setPhase("uploading");

    if (vaccinationFile) {
      const uploadResult = await uploadPortalDocument(
        dogId,
        vaccinationFile,
        "vaccination",
      );
      if (uploadResult.error) {
        setError(uploadResult.error.message);
        setPhase("idle");
        return;
      }
    }

    if (optionalFile) {
      const uploadResult = await uploadPortalDocument(
        dogId,
        optionalFile,
        optionalDocType,
      );
      if (uploadResult.error) {
        setError(uploadResult.error.message);
        setPhase("idle");
        return;
      }
    }

    router.push(
      `/portal/dogs/${dogId}?clientId=${encodeURIComponent(clientId)}&facilityId=${encodeURIComponent(facilityId)}`,
    );
    router.refresh();
  }

  const isSubmitting = phase !== "idle";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Add a Dog
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Tell us about your dog and upload any required documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Basic info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Input
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Breed"
              required
              value={form.breed}
              onChange={(e) => setForm({ ...form, breed: e.target.value })}
            />
            <Input
              label="Age"
              required
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="e.g. 3 years"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setForm({ ...form, size })}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm capitalize transition-colors",
                      form.size === size
                        ? "border-violet-400 bg-violet-50 text-violet-800"
                        : "border-stone-200 bg-white text-stone-600 hover:border-violet-200",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Owner contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Input
              label="Owner name"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              value={form.ownerPhone}
              onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.ownerEmail}
              onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Care details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Textarea
              label="Medication"
              value={form.medication}
              onChange={(e) => setForm({ ...form, medication: e.target.value })}
            />
            <Textarea
              label="Feeding instructions"
              value={form.feeding}
              onChange={(e) => setForm({ ...form, feeding: e.target.value })}
            />
            <Textarea
              label="Allergies"
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            />
            <Textarea
              label="Behavior notes"
              value={form.behavior}
              onChange={(e) => setForm({ ...form, behavior: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Vaccination record
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setVaccinationFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-700"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Optional additional document
              </label>
              <select
                value={optionalDocType}
                onChange={(e) =>
                  setOptionalDocType(e.target.value as DogDocumentType)
                }
                className="mb-2 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm"
              >
                {DOCUMENT_TYPES.filter((t) => t.value !== "vaccination").map(
                  (type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ),
                )}
              </select>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setOptionalFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-700"
              />
            </div>
            <p className="text-xs text-stone-500">
              PDF, JPG, PNG, or WEBP up to 10 MB each.
            </p>
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
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {phase === "creating"
              ? "Creating profile..."
              : phase === "uploading"
                ? "Uploading documents..."
                : "Add Dog"}
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
