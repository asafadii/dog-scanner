"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { checkOutDog, getActiveCheckins } from "@/lib/checkins";
import { getDogs, INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import type { Dog } from "@/lib/types";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function CheckinsView() {
  const [checkedIn, setCheckedIn] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadCheckedIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [dogsResult, checkinsResult] = await Promise.all([
      getDogs(),
      getActiveCheckins(),
    ]);

    if (dogsResult.error) {
      setError(dogsResult.error.message);
      setCheckedIn([]);
      setLoading(false);
      return;
    }

    if (checkinsResult.error) {
      setError(checkinsResult.error.message);
      setCheckedIn([]);
      setLoading(false);
      return;
    }

    const activeDogIds = new Set(
      checkinsResult.data.map((checkin) => checkin.dog_id),
    );
    setCheckedIn(
      dogsResult.data.filter((dog) => activeDogIds.has(dog.id)),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCheckedIn();
  }, [loadCheckedIn]);

  const toggleCheckStatus = useCallback(
    async (id: string) => {
      const dog = checkedIn.find((item) => item.id === id);
      if (!dog?.activeCheckinId || togglingId) return;

      setTogglingId(id);
      setActionError(null);

      const result = await checkOutDog(dog.activeCheckinId);
      if (result.error) {
        setActionError(result.error.message);
      } else {
        setCheckedIn((prev) =>
          prev.filter((item) => item.id !== id),
        );
      }

      setTogglingId(null);
    },
    [checkedIn, togglingId],
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-teal-600"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading check-ins...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void loadCheckedIn()}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <ClipboardCheck className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Check-ins
          </h2>
          <p className="mt-1 text-stone-500">
            {checkedIn.length} dog{checkedIn.length !== 1 ? "s" : ""} currently
            on site
          </p>
        </div>
      </div>

      {actionError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {actionError}
        </div>
      )}

      {checkedIn.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-stone-600">No dogs checked in right now.</p>
            <p className="mt-1 text-sm text-stone-400">
              Use the Dogs page to check someone in.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {checkedIn.map((dog) => (
            <DogCard
              key={dog.id}
              dog={dog}
              onCheckToggle={(dogId) => void toggleCheckStatus(dogId)}
              isToggling={togglingId === dog.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
