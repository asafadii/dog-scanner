"use client";

import { ClientCard } from "@/components/clients/ClientCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getClients, INCOMPLETE_SETUP_MESSAGE } from "@/lib/clients";
import type { Client } from "@/lib/types";
import { Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export function ClientsListView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getClients();
    if (result.error) {
      setError(result.error.message);
      setClients([]);
    } else {
      setClients(result.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        (client.email?.toLowerCase().includes(q) ?? false) ||
        (client.phone?.toLowerCase().includes(q) ?? false),
    );
  }, [clients, query]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-teal-600"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading clients...</p>
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
            onClick={() => void loadClients()}
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
            Clients
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {filtered.length} of {clients.length} client profiles
          </p>
        </div>
        <Link href="/clients/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden />
            Add Client
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
          placeholder="Search by name, email, or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11"
          aria-label="Search clients"
        />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
          <p className="text-stone-600">No client profiles yet.</p>
          <Link
            href="/clients/new"
            className="mt-3 inline-block text-sm font-medium text-teal-600 hover:underline"
          >
            Add your first client
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
          <p className="text-stone-600">No clients match your search.</p>
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
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
