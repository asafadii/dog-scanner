"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { CapacityCalendar } from "@/components/capacity/CapacityCalendar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  checkInDog,
  enrichDogWithCheckin,
  getActiveCheckins,
} from "@/lib/checkins";
import { getUpcomingBookings, INCOMPLETE_SETUP_MESSAGE } from "@/lib/bookings";
import { getDashboardKpiStats } from "@/lib/dashboard";
import { getDogs } from "@/lib/dogs";
import type { Booking, Dog, Payment } from "@/lib/types";
import { formatBookingDateRange, getTimeBasedGreeting } from "@/lib/utils";
import {
  CalendarDays,
  ClipboardCheck,
  Loader2,
  LogIn,
  Moon,
  Sun,
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
    key: "arrivalsToday" as const,
    label: "Arrivals Today",
    icon: LogIn,
    color: "text-blue-600 bg-blue-50",
    href: "/checkins",
  },
  {
    key: "daycareToday" as const,
    label: "Daycare Today",
    icon: Sun,
    color: "text-[oklch(0.531_0.092_185.0)] bg-[#F0FAF9]",
    href: "/checkins",
  },
  {
    key: "overnight" as const,
    label: "Overnight",
    icon: Moon,
    color: "text-amber-600 bg-amber-50",
    href: "/checkins",
  },
];

export function DashboardView() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    checkedIn: 0,
    arrivalsToday: 0,
    daycareToday: 0,
    overnight: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [dogsResult, checkinsResult, bookingsResult, kpiResult] =
      await Promise.all([
        getDogs(),
        getActiveCheckins(),
        getUpcomingBookings(5),
        getDashboardKpiStats(),
      ]);

    if (dogsResult.error) {
      setError(dogsResult.error.message);
      setDogs([]);
      setUpcomingBookings([]);
      setLoading(false);
      return;
    }

    if (checkinsResult.error) {
      setError(checkinsResult.error.message);
      setDogs([]);
      setUpcomingBookings([]);
      setLoading(false);
      return;
    }

    if (kpiResult.error) {
      setError(kpiResult.error.message);
      setDogs([]);
      setUpcomingBookings([]);
      setLoading(false);
      return;
    }

    setDogs(dogsResult.data);
    setStats(kpiResult.data);
    setUpcomingBookings(bookingsResult.error ? [] : bookingsResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

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
          const updated = enrichDogWithCheckin(dog, result.data);
          setDogs((prev) =>
            prev.map((item) => (item.id === id ? updated : item)),
          );
          void loadDashboard();
        }
      }

      setTogglingId(null);
    },
    [dogs, togglingId, loadDashboard],
  );

  const handleCheckoutComplete = useCallback(
    (dogId: string, payment: Payment) => {
      setDogs((prev) =>
        prev.map((item) =>
          item.id === dogId
            ? {
                ...item,
                status: "checked_out",
                activeCheckinId: null,
                currentAssignment: null,
                lastCheckOut: payment.paidAt,
              }
            : item,
        ),
      );
      void loadDashboard();
    },
    [loadDashboard],
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-[oklch(0.531_0.092_185.0)]"
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
          {getTimeBasedGreeting()}!
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

      <CapacityCalendar />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-900">
            Upcoming Bookings
          </h3>
          <Link
            href="/bookings"
            className="text-sm font-medium text-[oklch(0.531_0.092_185.0)] hover:underline"
          >
            View all
          </Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-stone-500">
              No upcoming bookings scheduled.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0FAF9] text-[oklch(0.531_0.092_185.0)]">
                      <CalendarDays className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-stone-900">
                          {booking.dogName}
                        </p>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-stone-500">
                        {booking.clientName} ·{" "}
                        {formatBookingDateRange(
                          booking.startDate,
                          booking.endDate,
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-900">
            Currently Checked In
          </h3>
          <Link
            href="/checkins"
            className="text-sm font-medium text-[oklch(0.531_0.092_185.0)] hover:underline"
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
                onCheckoutComplete={handleCheckoutComplete}
                isToggling={togglingId === dog.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
