"use client";

import { PortalDogDetailView } from "@/components/portal/PortalDogDetailView";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function PortalDogDetailPage({
  params,
}: {
  params: Promise<{ dogId: string }>;
}) {
  const { dogId } = use(params);
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";
  const facilityId = searchParams.get("facilityId") ?? "";

  if (!clientId || !facilityId) {
    return (
      <p className="text-sm text-red-800" role="alert">
        Missing dog or facility context.
      </p>
    );
  }

  return (
    <PortalDogDetailView
      dogId={dogId}
      clientId={clientId}
      facilityId={facilityId}
    />
  );
}
