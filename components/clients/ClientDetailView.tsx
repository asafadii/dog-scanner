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
import { sendClientInvite } from "@/lib/invite";
import type { Client, Dog } from "@/lib/types";
import {
  Loader2,
  Mail,
  MapPin,
  PawPrint,
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
  const [inviteSendLoading, setInviteSendLoading] = useState(false);
  const [inviteSendError, setInviteSendError] = useState<string | null>(null);
  const [inviteSendSuccess, setInviteSendSuccess] = useState<string | null>(
    null,
  );

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

  useEffect(() => {
    if (!inviteSendSuccess) return;

    const timer = setTimeout(() => setInviteSendSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [inviteSendSuccess]);

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

  async function handleSendInvite() {
    if (!client?.email?.trim()) return;

    setInviteSendLoading(true);
    setInviteSendError(null);
    setInviteSendSuccess(null);

    const result = await sendClientInvite(clientId);
    if (result.ok) {
      setInviteSendSuccess(`Invite sent to ${client.email}!`);
      await loadClient();
    } else {
      setInviteSendError(result.error);
    }

    setInviteSendLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading client...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
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
            className="text-sm font-medium text-primary hover:underline"
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
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <User className="h-8 w-8 text-primary" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {client.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {dogs.length} {dogs.length === 1 ? "dog" : "dogs"} on file
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!client.email?.trim() || inviteSendLoading}
            title={
              !client.email?.trim() ? "Add an email address first" : undefined
            }
            onClick={() => void handleSendInvite()}
          >
            {inviteSendLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Mail className="h-4 w-4" aria-hidden />
            )}
            {inviteSendLoading ? "Sending..." : "Invite Owner"}
          </Button>
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

      {inviteSendSuccess && (
        <p
          className="rounded-xl border border-success/25 bg-[#ECFDF5] px-4 py-3 text-sm text-success"
          role="status"
        >
          {inviteSendSuccess}
        </p>
      )}

      {inviteSendError && (
        <p className="text-sm text-danger" role="alert">
          {inviteSendError}
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" aria-hidden />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          {client.phone && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" aria-hidden />
                Phone
              </span>
              <a
                href={`tel:${client.phone}`}
                className="font-medium text-primary hover:underline"
              >
                {client.phone}
              </a>
            </div>
          )}
          {client.email && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" aria-hidden />
                Email
              </span>
              <a
                href={`mailto:${client.email}`}
                className="font-medium text-primary hover:underline"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.address && (
            <div className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden />
                Address
              </span>
              <span className="max-w-[60%] text-right font-medium text-foreground">
                {client.address}
              </span>
            </div>
          )}
          {client.emergencyContact && (
            <div className="border-t border-border pt-3">
              <p className="text-muted-foreground">Emergency Contact</p>
              <p className="mt-1 font-medium text-foreground">
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
          <p className="text-sm text-muted-foreground">
            Share an invite code so this client can link their portal account.
          </p>
          {client.inviteCode ? (
            // mint-wash #EAF4F1 tint = documented D-04 exception (Wave-2 precedent)
            <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/25 bg-mint-wash/50 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Invite code
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-widest text-foreground">
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
            <p className="text-sm text-danger" role="alert">
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
          <CardContent className="pt-0 text-sm text-foreground">
            <p className="whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Dogs</h3>
        {dogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border border-t-4 border-t-marker bg-surface py-12 text-center">
            <div className="mx-auto mb-3 flex w-fit rounded-xl bg-marker/20 p-3 text-[#5a4a1e]">
              <PawPrint className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-muted-foreground">No dogs linked to this client yet.</p>
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
