"use client";

import { SubscriptionView } from "@/components/subscription/SubscriptionView";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function SubscriptionFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2
        className="h-8 w-8 animate-spin text-primary"
        aria-hidden
      />
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<SubscriptionFallback />}>
      <SubscriptionView />
    </Suspense>
  );
}
