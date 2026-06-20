"use client";

import { PortalBookingCard } from "@/components/portal/PortalBookingCard";
import { PortalDogCard } from "@/components/portal/PortalDogCard";
import {
  buildFacilityOptions,
  PortalFacilityPicker,
  type FacilityOption,
} from "@/components/portal/PortalFacilityPicker";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getPortalBookings } from "@/lib/portal/bookings";
import { claimClientAccount } from "@/lib/portal/claim";
import { getPortalDogs } from "@/lib/portal/dogs";
import {
  getLinkedClients,
  requireClientAccount,
  type LinkedClient,
} from "@/lib/portal/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Booking, Dog } from "@/lib/types";
import { CalendarPlus, KeyRound, Loader2, PawPrint, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

export default function PortalPage() {
  const [linkedClients, setLinkedClients] = useState<LinkedClient[] | null>(
    null,
  );
  const [accountName, setAccountName] = useState<string>("");
  const [selectedFacility, setSelectedFacility] = useState<FacilityOption | null>(
    null,
  );
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);

  const facilityOptions = useMemo(
    () => buildFacilityOptions(linkedClients ?? []),
    [linkedClients],
  );

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
      const options = buildFacilityOptions(linkedResult.data);
      setSelectedFacility((current) => current ?? options[0] ?? null);
    }

    setLoading(false);
  }, []);

  const loadFacilityContent = useCallback(async (facility: FacilityOption) => {
    setContentLoading(true);

    const [dogsResult, bookingsResult] = await Promise.all([
      getPortalDogs(facility.clientId, facility.facilityId),
      getPortalBookings(facility.clientId, facility.facilityId),
    ]);

    setDogs(dogsResult.error ? [] : dogsResult.data);
    setBookings(bookingsResult.error ? [] : bookingsResult.data);
    setContentLoading(false);
  }, []);

  useEffect(() => {
    void loadPortalData();
  }, [loadPortalData]);

  useEffect(() => {
    if (!selectedFacility) return;
    void loadFacilityContent(selectedFacility);
  }, [loadFacilityContent, selectedFacility]);

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

  if (!hasLinks) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Welcome{accountName ? `, ${accountName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Link your account to get started
          </p>
        </div>

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
      </div>
    );
  }

  const newDogHref = selectedFacility
    ? `/portal/dogs/new?clientId=${encodeURIComponent(selectedFacility.clientId)}&facilityId=${encodeURIComponent(selectedFacility.facilityId)}`
    : "/portal/dogs/new";
  const newBookingHref = selectedFacility
    ? `/portal/bookings/new?clientId=${encodeURIComponent(selectedFacility.clientId)}&facilityId=${encodeURIComponent(selectedFacility.facilityId)}`
    : "/portal/bookings/new";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Welcome{accountName ? `, ${accountName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage your dogs and bookings
        </p>
      </div>

      <PortalFacilityPicker
        options={facilityOptions}
        selectedFacilityId={selectedFacility?.facilityId ?? ""}
        onChange={setSelectedFacility}
      />

      {contentLoading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" aria-hidden />
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
                <PawPrint className="h-5 w-5 text-violet-600" aria-hidden />
                Your Dogs
              </h2>
              <Link href={newDogHref}>
                <Button size="sm">
                  <Plus className="h-4 w-4" aria-hidden />
                  Add a Dog
                </Button>
              </Link>
            </div>

            {dogs.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-stone-500">
                  No dogs on file yet. Add your first dog to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {dogs.map((dog) =>
                  selectedFacility ? (
                    <PortalDogCard
                      key={dog.id}
                      dog={dog}
                      clientId={selectedFacility.clientId}
                      facilityId={selectedFacility.facilityId}
                    />
                  ) : null,
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
                <CalendarPlus className="h-5 w-5 text-violet-600" aria-hidden />
                Your Bookings
              </h2>
              <Link href={newBookingHref}>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" aria-hidden />
                  New Booking
                </Button>
              </Link>
            </div>

            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-stone-500">
                  No bookings yet. Request a stay when you&apos;re ready.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) =>
                  selectedFacility ? (
                    <PortalBookingCard
                      key={booking.id}
                      booking={booking}
                      clientId={selectedFacility.clientId}
                      facilityId={selectedFacility.facilityId}
                    />
                  ) : null,
                )}
              </div>
            )}
          </section>

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
        </>
      )}
    </div>
  );
}
