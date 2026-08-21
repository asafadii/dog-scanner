"use client";

import { PortalDogForm } from "@/components/portal/PortalDogForm";
import { ArchiveConfirmCard } from "@/components/ui/ArchiveConfirmCard";
import { Button } from "@/components/ui/Button";
import { dogToFormData } from "@/lib/dogs";
import {
  archivePortalDog,
  getPortalDogById,
} from "@/lib/portal/dogs";
import type { NewDogFormData } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function PortalEditDogPage() {
  const router = useRouter();
  const params = useParams<{ dogId: string }>();
  const searchParams = useSearchParams();
  const dogId = params.dogId;
  const clientId = searchParams.get("clientId") ?? "";
  const facilityId = searchParams.get("facilityId") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dogName, setDogName] = useState("");
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<NewDogFormData | null>(null);

  const contextQuery = `clientId=${encodeURIComponent(clientId)}&facilityId=${encodeURIComponent(facilityId)}`;
  const detailHref = `/portal/dogs/${dogId}?${contextQuery}`;

  const loadDog = useCallback(async () => {
    if (!clientId || !facilityId || !dogId) {
      setLoading(false);
      setError("Missing dog or facility context.");
      setInitialData(null);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getPortalDogById(dogId, clientId, facilityId);
    if (result.error || !result.data) {
      setError(result.error?.message ?? "Dog not found");
      setInitialData(null);
      setExistingPhotoUrl(null);
      setDogName("");
    } else {
      setInitialData(dogToFormData(result.data));
      setExistingPhotoUrl(result.data.photoUrl);
      setDogName(result.data.name);
    }

    setLoading(false);
  }, [clientId, dogId, facilityId]);

  useEffect(() => {
    void loadDog();
  }, [loadDog]);

  if (!clientId || !facilityId) {
    return (
      <p className="text-sm text-danger" role="alert">
        Missing dog or facility context.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
        <Button variant="outline" onClick={() => void loadDog()}>
          Try again
        </Button>
        <Link href="/portal">
          <Button variant="outline">Back to Portal</Button>
        </Link>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit Dog Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your dog&apos;s details or replace their photo.
        </p>
      </div>

      <PortalDogForm
        mode="edit"
        clientId={clientId}
        facilityId={facilityId}
        dogId={dogId}
        initialData={initialData}
        existingPhotoUrl={existingPhotoUrl}
        submitLabel="Save Changes"
        cancelHref={detailHref}
        onSuccess={() => {
          router.push(detailHref);
          router.refresh();
        }}
      />

      <ArchiveConfirmCard
        bare
        entityName={dogName || initialData.name}
        onConfirm={async () => {
          const result = await archivePortalDog(dogId, clientId, facilityId);
          return { error: result.error };
        }}
        onSuccess={() => {
          router.push("/portal");
          router.refresh();
        }}
      />
    </div>
  );
}
