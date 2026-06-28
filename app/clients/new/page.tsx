"use client";

import {
  ClientForm,
  type ClientFormSubmitPhase,
} from "@/components/clients/ClientForm";
import { Button } from "@/components/ui/Button";
import { createClient, INCOMPLETE_SETUP_MESSAGE } from "@/lib/clients";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewClientPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<ClientFormSubmitPhase>("idle");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          New Client
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Add a dog owner or guardian to link with their pets.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <ClientForm
        submitPhase={submitPhase}
        onSubmit={async (data) => {
          if (submitPhase !== "idle") return;

          setError(null);
          setSubmitPhase("saving");

          const result = await createClient(data);
          if (result.error) {
            setError(result.error.message);
            setSubmitPhase("idle");
            return;
          }

          router.push(`/clients/${result.data.id}`);
          router.refresh();
        }}
        submitLabel="Create Client"
      />

      {error === INCOMPLETE_SETUP_MESSAGE && (
        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/clients")}>
            Go to Settings
          </Button>
        </div>
      )}
    </div>
  );
}
