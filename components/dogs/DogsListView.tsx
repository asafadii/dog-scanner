"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMockStore } from "@/lib/mockStore";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function DogsListView() {
  const { dogs, toggleCheckStatus } = useMockStore();
  const [query, setQuery] = useState("");

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

      {filtered.length === 0 ? (
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
              onCheckToggle={toggleCheckStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
