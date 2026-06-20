"use client";

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
  Pill,
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
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
        <p className="text-sm text-stone-500">Loading dog profile...</p>
      </div>
    );
  }

  if (error || !dog) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-red-800" role="alert">
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
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-violet-50">
            <Image
              src={getDogPhotoSrc(dog.photoUrl)}
              alt={`Photo of ${dog.name}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              {dog.name}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {dog.breed}
              <span aria-hidden> · </span>
              {dog.age}
              <span aria-hidden> · </span>
              <span className="capitalize">{dog.size}</span>
            </p>
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
            <p className="font-medium text-stone-700">Feeding</p>
            <p className="mt-1 text-stone-600">{dog.care.feeding}</p>
          </div>
          <div>
            <p className="font-medium text-stone-700">Allergies</p>
            <p className="mt-1 text-stone-600">{dog.care.allergies}</p>
          </div>
          <div>
            <p className="font-medium text-stone-700">Medication</p>
            <p className="mt-1 text-stone-600">{dog.care.medication}</p>
          </div>
          <div>
            <p className="font-medium text-stone-700">Behavior notes</p>
            <p className="mt-1 text-stone-600">{dog.care.behavior}</p>
          </div>
        </CardContent>
      </Card>

      {(dog.alerts.medication ||
        dog.alerts.allergy ||
        dog.alerts.aggression ||
        dog.alerts.escapeRisk) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-900">
              <AlertTriangle className="h-5 w-5" aria-hidden />
              Important alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {dog.alerts.medication && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800">
                <Pill className="h-3.5 w-3.5" aria-hidden />
                Medication
              </span>
            )}
            {dog.alerts.allergy && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800">
                Allergy
              </span>
            )}
            {dog.alerts.aggression && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800">
                Aggression caution
              </span>
            )}
            {dog.alerts.escapeRisk && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800">
                Escape risk
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-violet-600" aria-hidden />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {documents.length === 0 ? (
            <p className="text-sm text-stone-500">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((document) => (
                <li key={document.id}>
                  <button
                    type="button"
                    onClick={() => void handleOpenDocument(document.id)}
                    disabled={openingDocId === document.id}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-left text-sm transition-colors hover:bg-violet-50",
                      openingDocId === document.id && "opacity-70",
                    )}
                  >
                    <span>
                      <span className="font-medium text-stone-900">
                        {documentTypeLabel(document.documentType)}
                      </span>
                      <span className="mt-0.5 block text-stone-500">
                        Uploaded{" "}
                        {new Date(document.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="text-violet-600">
                      {openingDocId === document.id ? "Opening..." : "View"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link href="/portal" className="inline-block text-sm font-medium text-violet-600 hover:underline">
        Back to Portal
      </Link>
    </div>
  );
}
