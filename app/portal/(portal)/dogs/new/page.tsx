"use client";

import { PortalDogForm } from "@/components/portal/PortalDogForm";
import { useRouter, useSearchParams } from "next/navigation";

export default function PortalNewDogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";
  const facilityId = searchParams.get("facilityId") ?? "";

  if (!clientId || !facilityId) {
    return (
      <p className="text-sm text-danger" role="alert">
        Missing facility context. Go back to the portal and try again.
      </p>
    );
  }

  const contextQuery = `clientId=${encodeURIComponent(clientId)}&facilityId=${encodeURIComponent(facilityId)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Add a Dog
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about your dog and upload any required documents.
        </p>
      </div>

      <PortalDogForm
        mode="create"
        clientId={clientId}
        facilityId={facilityId}
        submitLabel="Add Dog"
        cancelHref="/portal"
        onSuccess={(dogId) => {
          router.push(`/portal/dogs/${dogId}?${contextQuery}`);
          router.refresh();
        }}
      />
    </div>
  );
}
