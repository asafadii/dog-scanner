"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { Card, CardContent } from "@/components/ui/Card";
import { useMockStore } from "@/lib/mockStore";
import { ClipboardCheck } from "lucide-react";

export function CheckinsView() {
  const { dogs, toggleCheckStatus } = useMockStore();
  const checkedIn = dogs.filter((d) => d.status === "checked_in");

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
              onCheckToggle={toggleCheckStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
