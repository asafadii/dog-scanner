"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { claimClientAccount } from "@/lib/portal/claim";
import {
  getLinkedClients,
  requireClientAccount,
  type LinkedClient,
} from "@/lib/portal/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Building2, KeyRound, Loader2, User } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

export default function PortalPage() {
  const [linkedClients, setLinkedClients] = useState<LinkedClient[] | null>(
    null,
  );
  const [accountName, setAccountName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [claimCode, setClaimCode] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);

  const loadPortalData = useCallback(async () => {
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [accountResult, linkedResult] = await Promise.all([
      requireClientAccount(),
      getLinkedClients(),
    ]);

    if (accountResult.data) {
      setAccountName(accountResult.data.full_name);
    } else if (user) {
      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      setAccountName(metadataName || user.email?.split("@")[0] || "");
    }

    if (linkedResult.error?.code === "incomplete_setup") {
      setLinkedClients([]);
    } else if (linkedResult.error) {
      setLinkedClients([]);
    } else {
      setLinkedClients(linkedResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPortalData();
  }, [loadPortalData]);

  async function handleClaim(e: FormEvent) {
    e.preventDefault();
    setClaimError(null);
    setClaimLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        setClaimError("Your session expired. Please sign in again.");
        return;
      }

      await claimClientAccount(accessToken, claimCode);
      setClaimCode("");
      await loadPortalData();
    } catch (err) {
      setClaimError(
        err instanceof Error ? err.message : "Failed to link account.",
      );
    } finally {
      setClaimLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-violet-600"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading your portal...</p>
      </div>
    );
  }

  const hasLinks = linkedClients && linkedClients.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Welcome{accountName ? `, ${accountName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {hasLinks
            ? "Your linked daycare accounts"
            : "Link your account to get started"}
        </p>
      </div>

      {hasLinks ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">You&apos;re linked to</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {linkedClients.map((client) => (
              <div
                key={client.id}
                className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <User className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-stone-900">{client.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-500">
                    <Building2 className="h-3.5 w-3.5" aria-hidden />
                    {client.facilityName}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-5 w-5 text-violet-600" aria-hidden />
              Claim your account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="mb-4 text-sm text-stone-500">
              Enter the invite code your daycare gave you to link your profile.
            </p>
            <form onSubmit={handleClaim} className="space-y-4">
              <Input
                label="Invite code"
                type="text"
                required
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC12XYZ"
                autoComplete="off"
              />

              {claimError && (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {claimError}
                </p>
              )}

              <Button type="submit" size="lg" disabled={claimLoading}>
                {claimLoading ? "Linking..." : "Link Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {hasLinks && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Link another facility</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleClaim} className="space-y-4">
              <Input
                label="Invite code"
                type="text"
                required
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                placeholder="Enter another invite code"
                autoComplete="off"
              />

              {claimError && (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {claimError}
                </p>
              )}

              <Button
                type="submit"
                variant="outline"
                disabled={claimLoading}
              >
                {claimLoading ? "Linking..." : "Add Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
