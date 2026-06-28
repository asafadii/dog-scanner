"use client";

import { DogForm, type DogFormSubmitPhase } from "@/components/dogs/DogForm";
import { Button } from "@/components/ui/Button";
import {
  createDog,
  getCurrentUserProfile,
  INCOMPLETE_SETUP_MESSAGE,
} from "@/lib/dogs";
import { uploadDogPhoto } from "@/lib/storage";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function NewDogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get("clientId");
  const [error, setError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<DogFormSubmitPhase>("idle");

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

      <DogForm
        initialClientId={initialClientId}
        submitPhase={submitPhase}
        onSubmit={async (data, photo) => {
          if (submitPhase !== "idle") return;

          setError(null);

          try {
            let photoUrl: string | null = null;

            if (photo) {
              setSubmitPhase("uploading");
              const profileResult = await getCurrentUserProfile();
              if (profileResult.error) {
                setError(profileResult.error.message);
                setSubmitPhase("idle");
                return;
              }

              const uploadResult = await uploadDogPhoto(
                profileResult.data.facility_id,
                photo,
              );
              photoUrl = uploadResult.publicUrl;
            }

            setSubmitPhase("saving");
            const result = await createDog(data, photoUrl);
            if (result.error) {
              setError(result.error.message);
              setSubmitPhase("idle");
              return;
            }

            router.push(`/dogs/${result.data.id}`);
            router.refresh();
          } catch (uploadError) {
            setError(
              uploadError instanceof Error
                ? uploadError.message
                : "Upload failed. Please try again.",
            );
            setSubmitPhase("idle");
          }
        }}
        submitLabel="Create Dog Profile"
      />

      {error === INCOMPLETE_SETUP_MESSAGE && (
        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/dogs")}>
            Go to Settings
          </Button>
        </div>
      )}
    </div>
  );
}
