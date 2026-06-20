"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  generateClientInviteCode,
  getClientById,
  getClientDogs,
  INCOMPLETE_SETUP_MESSAGE,
} from "@/lib/clients";
import type { Client, Dog } from "@/lib/types";
import {
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface ClientDetailViewProps {
  clientId: string;
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const loadClient = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [clientResult, dogsResult] = await Promise.all([
      getClientById(clientId),
      getClientDogs(clientId),
    ]);

    if (clientResult.error) {
      setError(clientResult.error.message);
      setClient(null);
      setDogs([]);
    } else {
      setClient(clientResult.data);
      setDogs(dogsResult.error ? [] : dogsResult.data);
    }

    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  async function handleGenerateInviteCode() {
    setInviteLoading(true);
    setInviteError(null);

    const result = await generateClientInviteCode(clientId);
    if (result.error) {
      setInviteError(result.error.message);
    } else {
      await loadClient();
    }

    setInviteLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-teal-600"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading client...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-red-800" role="alert">
          {error ?? "Client not found"}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button variant="outline" onClick={() => void loadClient()}>
            Try again
          </Button>
        )}
        <div>
          <Link
            href="/clients"
            className="text-sm font-medium text-teal-600 hover:underline"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-amber-50">
            <User className="h-8 w-8 text-teal-600" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              {client.name}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {dogs.length} {dogs.length === 1 ? "dog" : "dogs"} on file
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/clients/${clientId}/edit`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit Client
            </Button>
          </Link>
          <Link href={`/dogs/new?clientId=${clientId}`}>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden />
              Add Dog
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" aria-hidden />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          {client.phone && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-stone-500">
                <Phone className="h-4 w-4" aria-hidden />
                Phone
              </span>
              <a
                href={`tel:${client.phone}`}
                className="font-medium text-teal-600 hover:underline"
              >
                {client.phone}
              </a>
            </div>
          )}
          {client.email && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-stone-500">
                <Mail className="h-4 w-4" aria-hidden />
                Email
              </span>
              <a
                href={`mailto:${client.email}`}
                className="font-medium text-teal-600 hover:underline"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.address && (
            <div className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-2 text-stone-500">
                <MapPin className="h-4 w-4" aria-hidden />
                Address
              </span>
              <span className="max-w-[60%] text-right font-medium text-stone-800">
                {client.address}
              </span>
            </div>
          )}
          {client.emergencyContact && (
            <div className="border-t border-stone-100 pt-3">
              <p className="text-stone-500">Emergency Contact</p>
              <p className="mt-1 font-medium text-stone-900">
                {client.emergencyContact}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Client Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-stone-500">
            Share an invite code so this client can link their portal account.
          </p>
          {client.inviteCode ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  Invite code
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-widest text-stone-900">
                  {client.inviteCode}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={inviteLoading}
                onClick={() => void handleGenerateInviteCode()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Regenerate
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              disabled={inviteLoading}
              onClick={() => void handleGenerateInviteCode()}
            >
              {inviteLoading ? "Generating..." : "Generate invite code"}
            </Button>
          )}
          {inviteError && (
            <p className="text-sm text-red-800" role="alert">
              {inviteError}
            </p>
          )}
        </CardContent>
      </Card>

      {client.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-stone-700">
            <p className="whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-stone-900">Dogs</h3>
        {dogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-12 text-center">
            <p className="text-stone-600">No dogs linked to this client yet.</p>
            <Link href={`/dogs/new?clientId=${clientId}`}>
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4" aria-hidden />
                Add Dog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
