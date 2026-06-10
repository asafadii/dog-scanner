"use client";

import { DogForm } from "@/components/dogs/DogForm";
import { Button } from "@/components/ui/Button";
import {
  createDog,
  INCOMPLETE_SETUP_MESSAGE,
} from "@/lib/dogs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewDogPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          New Dog Profile
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Create a profile when an owner drops off a new dog.
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

      {submitting ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white">
          <Loader2
            className="h-8 w-8 animate-spin text-teal-600"
            aria-hidden
          />
          <p className="text-sm text-stone-500">Creating profile...</p>
        </div>
      ) : (
        <DogForm
          onSubmit={async (data) => {
            setError(null);
            setSubmitting(true);

            const result = await createDog(data);
            if (result.error) {
              setError(result.error.message);
              setSubmitting(false);
              return;
            }

            router.push(`/dogs/${result.data.id}`);
            router.refresh();
          }}
          submitLabel="Create Dog Profile"
        />
      )}

      {error === INCOMPLETE_SETUP_MESSAGE && (
        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/settings")}>
            Go to Settings
          </Button>
        </div>
      )}
    </div>
  );
}
