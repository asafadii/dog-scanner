"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  checkInDog,
  enrichDogsWithCheckins,
  getActiveCheckins,
} from "@/lib/checkins";
import { getTodaysBookings } from "@/lib/bookings";
import { getDogs, INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { getActiveAssignmentsMap } from "@/lib/kennels";
import { slideUp } from "@/lib/motion";
import type { Booking, Dog, KennelAssignment, Payment } from "@/lib/types";
import { formatBookingDateRange } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardCheck, Loader2, ScanLine, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";

export function CheckinsView() {
  const [checkedIn, setCheckedIn] = useState<Dog[]>([]);
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [checkingInBookingId, setCheckingInBookingId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const loadCheckedIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [dogsResult, checkinsResult, bookingsResult] = await Promise.all([
      getDogs(),
      getActiveCheckins(),
      getTodaysBookings(),
    ]);

    if (dogsResult.error) {
      setError(dogsResult.error.message);
      setCheckedIn([]);
      setTodaysBookings([]);
      setLoading(false);
      return;
    }

    if (checkinsResult.error) {
      setError(checkinsResult.error.message);
      setCheckedIn([]);
      setTodaysBookings([]);
      setLoading(false);
      return;
    }

    if (bookingsResult.error) {
      setError(bookingsResult.error.message);
      setCheckedIn([]);
      setTodaysBookings([]);
      setLoading(false);
      return;
    }

    const activeDogIds = new Set(
      checkinsResult.data.map((checkin) => checkin.dog_id),
    );
    setTodaysBookings(
      bookingsResult.data.filter((booking) => !activeDogIds.has(booking.dogId)),
    );
    const checkedInDogs = enrichDogsWithCheckins(
      dogsResult.data.filter((dog) => activeDogIds.has(dog.id)),
      checkinsResult.data,
    );

    const checkinIds = checkinsResult.data.map((checkin) => checkin.id);
    const assignmentsResult = await getActiveAssignmentsMap(checkinIds);
    if (assignmentsResult.error) {
      setError(assignmentsResult.error.message);
      setCheckedIn([]);
      setLoading(false);
      return;
    }

    setCheckedIn(
      checkedInDogs.map((dog) => ({
        ...dog,
        currentAssignment: dog.activeCheckinId
          ? assignmentsResult.data.get(dog.activeCheckinId) ?? null
          : null,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCheckedIn();
  }, [loadCheckedIn]);

  const toggleCheckStatus = useCallback(
    async (id: string) => {
      const dog = checkedIn.find((item) => item.id === id);
      if (!dog || togglingId || dog.status === "checked_in") return;

      setTogglingId(id);
      setActionError(null);

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
        void loadCheckedIn();
      }

      setTogglingId(null);
    },
    [checkedIn, togglingId, loadCheckedIn],
  );

  const handleCheckoutComplete = useCallback((dogId: string, _payment: Payment) => {
    setCheckedIn((prev) => prev.filter((dog) => dog.id !== dogId));
  }, []);

  const handleAssignmentChange = useCallback(
    (dogId: string, assignment: KennelAssignment) => {
      setCheckedIn((prev) =>
        prev.map((dog) =>
          dog.id === dogId
            ? { ...dog, currentAssignment: assignment }
            : dog,
        ),
      );
    },
    [],
  );

  const handleBookingCheckIn = useCallback(
    async (booking: Booking) => {
      if (checkingInBookingId) return;

      setCheckingInBookingId(booking.id);
      setActionError(null);

      const result = await checkInDog(booking.dogId, booking.id);
      if (result.error) {
        setActionError(result.error.message);
      } else {
        void loadCheckedIn();
      }

      setCheckingInBookingId(null);
    },
    [checkingInBookingId, loadCheckedIn],
  );

  const filteredCheckedIn = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return checkedIn;

    return checkedIn.filter(
      (dog) =>
        dog.name.toLowerCase().includes(normalized) ||
        dog.owner.name.toLowerCase().includes(normalized) ||
        (dog.client?.name.toLowerCase().includes(normalized) ?? false),
    );
  }, [checkedIn, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-[oklch(0.531_0.092_185.0)]"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading check-ins...</p>
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
            onClick={() => void loadCheckedIn()}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
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
        <Link href="/checkins/scan">
          <Button variant="outline" size="sm">
            <ScanLine className="h-4 w-4" aria-hidden />
            Scan to Check In
          </Button>
        </Link>
      </div>

      <AnimatePresence>
        {actionError && (
          <motion.div
            key="action-error"
            {...slideUp}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {actionError}
          </motion.div>
        )}
      </AnimatePresence>

      {todaysBookings.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-stone-900">
              Today&apos;s bookings
            </h3>
            <p className="text-sm text-stone-500">
              Approved bookings ready for check-in, plus any awaiting approval.
            </p>
          </div>
          <div className="space-y-3">
            {todaysBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-stone-900">
                        {booking.dogName}
                      </p>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-stone-500">
                      {booking.clientName} ·{" "}
                      {formatBookingDateRange(
                        booking.startDate,
                        booking.endDate,
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href={`/bookings/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        View booking
                      </Button>
                    </Link>
                    {booking.status === "approved" && (
                      <Button
                        size="sm"
                        disabled={checkingInBookingId === booking.id}
                        onClick={() => void handleBookingCheckIn(booking)}
                      >
                        {checkingInBookingId === booking.id
                          ? "Checking in..."
                          : "Check in"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-stone-900">On site now</h3>

        {checkedIn.length > 0 && (
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search by dog or owner name..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
              aria-label="Search checked-in dogs"
            />
          </div>
        )}

      {checkedIn.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-stone-600">No dogs checked in right now.</p>
            <p className="mt-1 text-sm text-stone-400">
              Scan a QR code or check in from today&apos;s bookings above.
            </p>
          </CardContent>
        </Card>
      ) : filteredCheckedIn.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-stone-500">
            No dogs match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredCheckedIn.map((dog) => (
            <DogCard
              key={dog.id}
              dog={dog}
              onCheckToggle={(dogId) => void toggleCheckStatus(dogId)}
              onAssignmentChange={handleAssignmentChange}
              onCheckoutComplete={handleCheckoutComplete}
              isToggling={togglingId === dog.id}
            />
          ))}
        </div>
      )}
      </section>
    </div>
  );
}
