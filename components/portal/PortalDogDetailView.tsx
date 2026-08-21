"use client";

import { DogAlertBadges } from "@/components/dogs/DogAlertBadges";
import { BookingHistorySection } from "@/components/bookings/BookingHistorySection";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getDogBookingHistory } from "@/lib/portal/bookings";
import {
  findCurrentVaccinationDocument,
  getDocumentValidationMessage,
  getDogDocuments,
  getPortalDocumentUrl,
  parseVaccinationExpiryDate,
  uploadPortalDocument,
  validateDocumentFile,
  VACCINATION_EXPIRY_REQUIRED_MESSAGE,
} from "@/lib/portal/documents";
import { getPortalDogById } from "@/lib/portal/dogs";
import type { Dog, DogDocument, DogDocumentType } from "@/lib/types";
import { cn, formatBookingDate } from "@/lib/utils";
import { getDogPhotoSrc } from "@/lib/dogAssets";
import {
  AlertTriangle,
  CalendarPlus,
  FileText,
  Loader2,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface PortalDogDetailViewProps {
  dogId: string;
  clientId: string;
  facilityId: string;
}

function documentTypeLabel(type: DogDocument["documentType"]): string {
  switch (type) {
    case "vaccination":
      return "Vaccination record";
    case "pedigree":
      return "Pedigree";
    default:
      return "Other document";
  }
}

export function PortalDogDetailView({
  dogId,
  clientId,
  facilityId,
}: PortalDogDetailViewProps) {
  const [dog, setDog] = useState<Dog | null>(null);
  const [documents, setDocuments] = useState<DogDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<DogDocumentType>("vaccination");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadDog = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [dogResult, documentsResult] = await Promise.all([
      getPortalDogById(dogId, clientId, facilityId),
      getDogDocuments(dogId),
    ]);

    if (dogResult.error) {
      setError(dogResult.error.message);
      setDog(null);
      setDocuments([]);
    } else {
      setDog(dogResult.data);
      setDocuments(documentsResult.error ? [] : documentsResult.data);
    }

    setLoading(false);
  }, [clientId, dogId, facilityId]);

  const loadHistoryPage = useCallback(
    (offset: number, limit: number) =>
      getDogBookingHistory(dogId, clientId, facilityId, { offset, limit }),
    [clientId, dogId, facilityId],
  );

  useEffect(() => {
    void loadDog();
  }, [loadDog]);

  async function handleOpenDocument(documentId: string) {
    setOpeningDocId(documentId);
    const result = await getPortalDocumentUrl(documentId);
    setOpeningDocId(null);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    window.open(result.data, "_blank", "noopener,noreferrer");
  }

  async function handleUpload(file: File | null) {
    if (!file || uploading) return;

    setUploadError(null);

    const validation = validateDocumentFile(file);
    if (!validation.ok) {
      setUploadError(getDocumentValidationMessage(validation.code));
      return;
    }

    const expiryDate = parseVaccinationExpiryDate(uploadExpiryDate);
    if (uploadType === "vaccination" && !expiryDate) {
      setUploadError(VACCINATION_EXPIRY_REQUIRED_MESSAGE);
      return;
    }

    setUploading(true);
    const result = await uploadPortalDocument(
      dogId,
      file,
      uploadType,
      expiryDate ?? undefined,
    );
    if (result.error) {
      setUploadError(result.error.message);
      setUploading(false);
      return;
    }

    const [listResult, dogResult] = await Promise.all([
      getDogDocuments(dogId),
      getPortalDogById(dogId, clientId, facilityId),
    ]);
    if (listResult.error) {
      setUploadError(listResult.error.message);
    } else {
      setDocuments(listResult.data);
    }
    if (!dogResult.error && dogResult.data) {
      setDog(dogResult.data);
    }
    setUploading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading dog profile...</p>
      </div>
    );
  }

  if (error || !dog) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
          {error ?? "Dog not found"}
        </p>
        <Link href="/portal">
          <Button variant="outline">Back to Portal</Button>
        </Link>
      </div>
    );
  }

  const bookingHref = `/portal/bookings/new?clientId=${encodeURIComponent(clientId)}&facilityId=${encodeURIComponent(facilityId)}&dogId=${encodeURIComponent(dogId)}`;
  const editHref = `/portal/dogs/${dogId}/edit?clientId=${encodeURIComponent(clientId)}&facilityId=${encodeURIComponent(facilityId)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
            <Image
              src={getDogPhotoSrc(dog.photoUrl)}
              alt={`Photo of ${dog.name}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {dog.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[
                dog.breed,
                dog.age,
                dog.gender === "male"
                  ? "Male"
                  : dog.gender === "female"
                    ? "Female"
                    : null,
              ]
                .filter((part): part is string => Boolean(part))
                .join(" · ")}
              <span aria-hidden> · </span>
              <span className="capitalize">{dog.size}</span>
            </p>
            {/* Solid safety flags surfaced on the portal via the shared component (internals untouched) */}
            <DogAlertBadges alerts={dog.alerts} compact className="mt-2.5" />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href={editHref}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <Link href={bookingHref}>
            <Button className="w-full sm:w-auto">
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Book a Stay
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Care Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          <div>
            <p className="font-medium text-foreground">Feeding</p>
            <p className="mt-1 text-muted-foreground">
              {`Set per booking${
                dog.feedingMealsPerDay
                  ? ` · ${dog.feedingMealsPerDay} meal${dog.feedingMealsPerDay === 1 ? "" : "s"} per day`
                  : ""
              }`}
            </p>
            {dog.care.feedingNotes !== "None" && (
              <p className="mt-1 text-muted-foreground">{dog.care.feedingNotes}</p>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">Allergies</p>
            <p className="mt-1 text-muted-foreground">{dog.care.allergies}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Medication</p>
            <p className="mt-1 text-muted-foreground">{dog.care.medication}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Behavior notes</p>
            <p className="mt-1 text-muted-foreground">{dog.care.behavior}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Vaccination expiry date</p>
            <p className="mt-1 text-muted-foreground">
              {dog.vaccinationExpiryDate ? (
                formatBookingDate(dog.vaccinationExpiryDate)
              ) : (
                <span>Not recorded</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {(dog.alerts.medication ||
        dog.alerts.allergy ||
        dog.alerts.aggressionTowardsPeople ||
        dog.alerts.aggressionTowardsDogs ||
        dog.alerts.chewingRisk ||
        dog.alerts.escapeRisk) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-primary" aria-hidden />
              Important alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Solid safety flags rendered via the shared component (internals untouched) */}
            <DogAlertBadges alerts={dog.alerts} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" aria-hidden />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((document) => {
                const isCurrent =
                  findCurrentVaccinationDocument(documents)?.id ===
                  document.id;
                return (
                <li key={document.id}>
                  <button
                    type="button"
                    onClick={() => void handleOpenDocument(document.id)}
                    disabled={openingDocId === document.id}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-primary/40",
                      openingDocId === document.id && "opacity-70",
                    )}
                  >
                    <span>
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {documentTypeLabel(document.documentType)}
                        {isCurrent ? (
                          <Badge variant="teal">Current</Badge>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-muted-foreground">
                        Uploaded{" "}
                        {new Date(document.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="text-primary">
                      {openingDocId === document.id ? "Opening..." : "View"}
                    </span>
                  </button>
                </li>
                );
              })}
            </ul>
          )}

          <div className="space-y-3 border-t border-border pt-4">
            <Select
              id="portal-document-type"
              label="Document type"
              value={uploadType}
              disabled={uploading}
              onChange={(e) =>
                setUploadType(e.target.value as DogDocumentType)
              }
            >
              <option value="vaccination">Vaccination</option>
              <option value="pedigree">Pedigree</option>
              <option value="other">Other</option>
            </Select>
            {uploadType === "vaccination" ? (
              <Input
                type="date"
                id="portal-document-upload-expiry"
                label="New expiry date"
                value={uploadExpiryDate}
                onChange={(e) => setUploadExpiryDate(e.target.value)}
                required
                disabled={uploading}
              />
            ) : null}
            <div>
              <label
                htmlFor="portal-document-upload"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Upload document
              </label>
              <input
                id="portal-document-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                disabled={
                  uploading ||
                  (uploadType === "vaccination" &&
                    !parseVaccinationExpiryDate(uploadExpiryDate))
                }
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  void handleUpload(file);
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-mint-wash file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
              />
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Uploading...
              </div>
            )}
            {uploadError && (
              <p
                className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {uploadError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <BookingHistorySection
        loadPage={loadHistoryPage}
        hrefForEntry={(entry) =>
          `/portal/bookings/${entry.booking.id}?clientId=${encodeURIComponent(clientId)}&facilityId=${encodeURIComponent(facilityId)}`
        }
        titleClassName="text-base"
      />

      <Link href="/portal" className="inline-block text-sm font-medium text-primary hover:underline">
        Back to Portal
      </Link>
    </div>
  );
}
