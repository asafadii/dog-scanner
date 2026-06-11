"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  checkInDog,
  checkOutDog,
  enrichDogAfterCheckout,
  enrichDogWithCheckin,
  getActiveCheckins,
} from "@/lib/checkins";
import { getDogs, INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { getDashboardStats } from "@/lib/mockData";
import type { Dog } from "@/lib/types";
import {
  ClipboardCheck,
  Loader2,
  Moon,
  PawPrint,
  Pill,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STAT_CONFIG = [
  {
    key: "checkedIn" as const,
    label: "Checked In",
    icon: ClipboardCheck,
    color: "text-emerald-600 bg-emerald-50",
    href: "/checkins",
  },
  {
    key: "needMedication" as const,
    label: "Need Medication",
    icon: Pill,
    color: "text-violet-600 bg-violet-50",
    href: "/dogs",
  },
  {
    key: "overnight" as const,
    label: "Overnight Stays",
    icon: Moon,
    color: "text-amber-600 bg-amber-50",
    href: "/checkins",
  },
  {
    key: "total" as const,
    label: "Total Dogs",
    icon: PawPrint,
    color: "text-teal-600 bg-teal-50",
    href: "/dogs",
  },
];

export function DashboardView() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [dogsResult, checkinsResult] = await Promise.all([
      getDogs(),
      getActiveCheckins(),
    ]);

    if (dogsResult.error) {
      setError(dogsResult.error.message);
      setDogs([]);
      setCheckedInCount(0);
      setLoading(false);
      return;
    }

    if (checkinsResult.error) {
      setError(checkinsResult.error.message);
      setDogs([]);
      setCheckedInCount(0);
      setLoading(false);
      return;
    }

    setDogs(dogsResult.data);
    setCheckedInCount(checkinsResult.data.length);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const base = getDashboardStats(dogs);
    return {
      ...base,
      checkedIn: checkedInCount,
    };
  }, [dogs, checkedInCount]);

  const checkedInDogs = useMemo(
    () => dogs.filter((dog) => dog.status === "checked_in").slice(0, 3),
    [dogs],
  );

  const toggleCheckStatus = useCallback(
    async (id: string) => {
      const dog = dogs.find((item) => item.id === id);
      if (!dog || togglingId) return;

      setTogglingId(id);
      setActionError(null);

      if (dog.status === "checked_out") {
        const result = await checkInDog(id);
        if (result.error) {
          setActionError(result.error.message);
        } else {
          const updated = enrichDogWithCheckin(dog, result.data);
          setDogs((prev) =>
            prev.map((item) => (item.id === id ? updated : item)),
          );
          setCheckedInCount((count) => count + 1);
        }
      } else if (dog.activeCheckinId) {
        const result = await checkOutDog(dog.activeCheckinId);
        if (result.error) {
          setActionError(result.error.message);
        } else {
          setDogs((prev) =>
            prev.map((item) =>
              item.id === id ? enrichDogAfterCheckout(item, result.data) : item,
            ),
          );
          setCheckedInCount((count) => Math.max(0, count - 1));
        }
      }

      setTogglingId(null);
    },
    [dogs, togglingId],
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-teal-600"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading dashboard...</p>
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
            onClick={() => void loadDashboard()}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Good morning!
        </h2>
        <p className="mt-1 text-stone-500">
          Here&apos;s what&apos;s happening at the facility today.
        </p>
      </div>

      {actionError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, href }) => (
          <Link key={key} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3 text-2xl font-bold tabular-nums text-stone-900">
                  {stats[key]}
                </p>
                <p className="text-sm text-stone-500">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-900">
            Currently Checked In
          </h3>
          <Link
            href="/checkins"
            className="text-sm font-medium text-teal-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {checkedInDogs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-stone-500">
              No dogs checked in right now.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {checkedInDogs.map((dog) => (
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
    </div>
  );
}
