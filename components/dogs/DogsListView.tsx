"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  checkInDog,
  checkOutDog,
  enrichDogAfterCheckout,
  enrichDogWithCheckin,
} from "@/lib/checkins";
import {
  getDogs,
  INCOMPLETE_SETUP_MESSAGE,
} from "@/lib/dogs";
import type { Dog } from "@/lib/types";
import { Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export function DogsListView() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadDogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getDogs();
    if (result.error) {
      setError(result.error.message);
      setDogs([]);
    } else {
      setDogs(result.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDogs();
  }, [loadDogs]);

  const toggleCheckStatus = useCallback(async (id: string) => {
    const dog = dogs.find((item) => item.id === id);
    if (!dog || togglingId) return;

    setTogglingId(id);
    setActionError(null);

    if (dog.status === "checked_out") {
      let result = await checkInDog(id);
      if (
        result.error?.code === "no_approved_booking" &&
        window.confirm(
          `${dog.name} doesn't have an approved booking for today. Check in anyway?`,
        )
      ) {
        result = await checkInDog(id, undefined, { force: true });
      }
      if (result.error) {
        setActionError(result.error.message);
      } else {
        setDogs((prev) =>
          prev.map((item) =>
            item.id === id ? enrichDogWithCheckin(item, result.data) : item,
          ),
        );
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
      }
    }

    setTogglingId(null);
  }, [dogs, togglingId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dogs;
    return dogs.filter(
      (dog) =>
        dog.name.toLowerCase().includes(q) ||
        dog.breed.toLowerCase().includes(q) ||
        dog.owner.name.toLowerCase().includes(q),
    );
  }, [dogs, query]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-teal-600"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading dogs...</p>
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
            onClick={() => void loadDogs()}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            All Dogs
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {filtered.length} of {dogs.length} profiles
          </p>
        </div>
        <Link href="/dogs/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden />
            Add Dog
          </Button>
        </Link>
      </div>

      {actionError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {actionError}
        </div>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search by name, breed, or owner..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11"
          aria-label="Search dogs"
        />
      </div>

      {dogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
          <p className="text-stone-600">No dog profiles yet.</p>
          <Link
            href="/dogs/new"
            className="mt-3 inline-block text-sm font-medium text-teal-600 hover:underline"
          >
            Add your first dog
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
          <p className="text-stone-600">No dogs match your search.</p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-2 text-sm font-medium text-teal-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((dog) => (
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
