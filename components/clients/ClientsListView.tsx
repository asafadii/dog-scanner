"use client";

import { ClientCard } from "@/components/clients/ClientCard";
import {
  useFacilityAccess,
  WRITE_LOCKED_TITLE,
} from "@/components/app/FacilityAccessContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getClients, INCOMPLETE_SETUP_MESSAGE } from "@/lib/clients";
import { sendClientInvite } from "@/lib/invite";
import type { Client } from "@/lib/types";
import { Loader2, Mail, Plus, Search, User, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export function ClientsListView() {
  const { accessLevel } = useFacilityAccess();
  const writeLocked = accessLevel !== "full";
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteClientId, setInviteClientId] = useState("");
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

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

  const inviteableClients = useMemo(
    () => clients.filter((client) => client.email?.trim()),
    [clients],
  );

  const filteredInviteClients = useMemo(() => {
    const q = inviteSearch.trim().toLowerCase();
    if (!q) return inviteableClients;
    return inviteableClients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        (client.email?.toLowerCase().includes(q) ?? false),
    );
  }, [inviteableClients, inviteSearch]);

  useEffect(() => {
    if (!inviteOpen) return;

    if (
      inviteClientId &&
      !filteredInviteClients.some((client) => client.id === inviteClientId)
    ) {
      setInviteClientId(filteredInviteClients[0]?.id ?? "");
    }
  }, [inviteOpen, inviteClientId, filteredInviteClients]);

  useEffect(() => {
    if (!inviteOpen) return;

    const timer = setTimeout(() => setInviteSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [inviteOpen, inviteSuccess]);

  function openInvitePanel() {
    setInviteOpen(true);
    setInviteError(null);
    setInviteSuccess(null);
    setInviteSearch("");
    setInviteClientId(inviteableClients[0]?.id ?? "");
  }

  function closeInvitePanel() {
    setInviteOpen(false);
    setInviteError(null);
    setInviteSuccess(null);
    setInviteSending(false);
  }

  async function handleSendInvite() {
    if (!inviteClientId) return;

    setInviteSending(true);
    setInviteError(null);
    setInviteSuccess(null);

    const result = await sendClientInvite(inviteClientId);
    if (result.ok) {
      const client = inviteableClients.find((item) => item.id === inviteClientId);
      setInviteSuccess(`Invite sent to ${client?.email ?? "the client"}!`);
    } else {
      setInviteError(result.error);
    }

    setInviteSending(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/25 bg-danger/10 px-6 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Clients
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {clients.length} client profiles
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={openInvitePanel}
            disabled={inviteableClients.length === 0}
            title={
              inviteableClients.length === 0
                ? "No clients with an email address"
                : undefined
            }
          >
            <Mail className="h-4 w-4" aria-hidden />
            Invite Owner
          </Button>
          {writeLocked ? (
            <Button
              className="w-full sm:w-auto"
              disabled
              title={WRITE_LOCKED_TITLE}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add Client
            </Button>
          ) : (
            <Link href="/clients/new">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4" aria-hidden />
                Add Client
              </Button>
            </Link>
          )}
        </div>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Invite Owner
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Send a signup link to a client by email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeInvitePanel}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Close invite panel"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <Input
                type="search"
                label="Search clients"
                placeholder="Search by name or email..."
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                disabled={inviteSending}
              />

              <Select
                label="Client"
                value={inviteClientId}
                onChange={(e) => setInviteClientId(e.target.value)}
                disabled={inviteSending || filteredInviteClients.length === 0}
              >
                <option value="" disabled>
                  {filteredInviteClients.length === 0
                    ? "No matching clients with email"
                    : "Select a client"}
                </option>
                {filteredInviteClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </Select>

              {inviteError && (
                <p className="text-sm text-danger" role="alert">
                  {inviteError}
                </p>
              )}

              {inviteSuccess && (
                <p
                  className="rounded-xl border border-success/25 bg-[#ECFDF5] px-4 py-3 text-sm text-success"
                  role="status"
                >
                  {inviteSuccess}
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={closeInvitePanel}
                  disabled={inviteSending}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleSendInvite()}
                  disabled={
                    inviteSending ||
                    !inviteClientId ||
                    filteredInviteClients.length === 0
                  }
                  className="w-full sm:w-auto"
                >
                  {inviteSending && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  )}
                  {inviteSending ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
        <div className="rounded-2xl border border-dashed border-border border-t-4 border-t-marker bg-surface py-16 text-center">
          <div className="mx-auto mb-3 flex w-fit rounded-xl bg-marker/20 p-3 text-[#5a4a1e]">
            <User className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-muted-foreground">No client profiles yet.</p>
          <Link
            href="/clients/new"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Add your first client
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border border-t-4 border-t-marker bg-surface py-16 text-center">
          <div className="mx-auto mb-3 flex w-fit rounded-xl bg-marker/20 p-3 text-[#5a4a1e]">
            <Search className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-muted-foreground">No clients match your search.</p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-2 text-sm font-medium text-primary hover:underline"
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
