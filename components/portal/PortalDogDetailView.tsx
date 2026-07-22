"use client";

import { DogAlertBadges } from "@/components/dogs/DogAlertBadges";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getDogDocuments, getPortalDocumentUrl } from "@/lib/portal/documents";
import { getPortalDogById } from "@/lib/portal/dogs";
import type { Dog, DogDocument } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getDogPhotoSrc } from "@/lib/dogAssets";
import {
  AlertTriangle,
  CalendarPlus,
  FileText,
  Loader2,
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
              {dog.breed}
              <span aria-hidden> · </span>
              {dog.age}
              <span aria-hidden> · </span>
              <span className="capitalize">{dog.size}</span>
            </p>
            {/* Solid safety flags surfaced on the portal via the shared component (internals untouched) */}
            <DogAlertBadges alerts={dog.alerts} compact className="mt-2.5" />
          </div>
        </div>
        <Link href={bookingHref}>
          <Button className="w-full sm:w-auto">
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Book a Stay
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Care Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          <div>
            <p className="font-medium text-foreground">Feeding</p>
            <p className="mt-1 text-muted-foreground">
              {dog.feedingSource
                ? `${dog.feedingSource === "own" ? "Own food" : "Facility food"}${
                    dog.feedingMealsPerDay
                      ? ` · ${dog.feedingMealsPerDay} meal${dog.feedingMealsPerDay === 1 ? "" : "s"} per day`
                      : ""
                  }`
                : dog.care.feedingNotes !== "None"
                  ? dog.care.feedingNotes
                  : "Not recorded"}
            </p>
            {dog.care.feedingNotes !== "None" && dog.feedingSource && (
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
        <CardContent className="pt-0">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((document) => (
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
                      <span className="font-medium text-foreground">
                        {documentTypeLabel(document.documentType)}
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
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link href="/portal" className="inline-block text-sm font-medium text-primary hover:underline">
        Back to Portal
      </Link>
    </div>
  );
}
