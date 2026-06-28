"use client";

import { DogForm, type DogFormSubmitPhase } from "@/components/dogs/DogForm";
import { Button } from "@/components/ui/Button";
import {
  dogToFormData,
  getCurrentUserProfile,
  getDogById,
  INCOMPLETE_SETUP_MESSAGE,
  updateDog,
} from "@/lib/dogs";
import { uploadDogPhoto } from "@/lib/storage";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function EditDogPage() {
  const router = useRouter();
  const params = useParams<{ dogId: string }>();
  const dogId = params.dogId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<DogFormSubmitPhase>("idle");
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<ReturnType<
    typeof dogToFormData
  > | null>(null);

  const loadDog = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getDogById(dogId);
    if (result.error) {
      setError(result.error.message);
      setInitialData(null);
      setExistingPhotoUrl(null);
    } else {
      setInitialData(dogToFormData(result.data));
      setExistingPhotoUrl(result.data.photoUrl);
    }

    setLoading(false);
  }, [dogId]);

  useEffect(() => {
    void loadDog();
  }, [loadDog]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-[oklch(0.531_0.092_185.0)]"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading profile...</p>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button variant="outline" onClick={() => void loadDog()}>
            Try again
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/dogs")}>
          Back to Dogs
        </Button>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Edit Dog Profile
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Update profile details or replace the dog&apos;s photo.
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
        initialData={initialData}
        existingPhotoUrl={existingPhotoUrl}
        submitPhase={submitPhase}
        submitLabel="Save Changes"
        onSubmit={async (data, photo) => {
          if (submitPhase !== "idle") return;

          setError(null);

          try {
            let photoUrl: string | undefined;

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
                dogId,
              );
              photoUrl = uploadResult.publicUrl;
            }

            setSubmitPhase("saving");
            const result = await updateDog(dogId, {
              ...data,
              ...(photoUrl !== undefined ? { photoUrl } : {}),
            });

            if (result.error) {
              setError(result.error.message);
              setSubmitPhase("idle");
              return;
            }

            router.push(`/dogs/${dogId}`);
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
      />
    </div>
  );
}
