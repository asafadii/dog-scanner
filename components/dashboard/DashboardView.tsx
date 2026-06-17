"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { CapacityUsageBar } from "@/components/capacity/CapacityUsageBar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  checkInDog,
  checkOutDog,
  enrichDogAfterCheckout,
  enrichDogWithCheckin,
  getActiveCheckins,
} from "@/lib/checkins";
import { getUpcomingBookings, INCOMPLETE_SETUP_MESSAGE } from "@/lib/bookings";
import { getTodaysCapacityUsage } from "@/lib/capacity";
import { getDogs } from "@/lib/dogs";
import { getDashboardStats } from "@/lib/mockData";
import type { Booking, CapacityUsage, Dog } from "@/lib/types";
import { formatBookingDateRange } from "@/lib/utils";
import {
  CalendarDays,
  ClipboardCheck,
  Gauge,
  Loader2,
  Moon,
  PawPrint,
  Pill,
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
    key: "needMedication" as const,
    label: "Need Medication",
    icon: Pill,
    color: "text-violet-600 bg-violet-50",
    href: "/dogs",
  },
  {
    key: "overnight" as const,
    label: "Overnight Stays",
    icon: Moon,
    color: "text-amber-600 bg-amber-50",
    href: "/checkins",
  },
  {
    key: "total" as const,
    label: "Total Dogs",
    icon: PawPrint,
    color: "text-teal-600 bg-teal-50",
    href: "/dogs",
  },
];

export function DashboardView() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [capacityUsage, setCapacityUsage] = useState<{
    daycare: CapacityUsage;
    boarding: CapacityUsage;
  } | null>(null);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [dogsResult, checkinsResult, bookingsResult, capacityResult] =
      await Promise.all([
      getDogs(),
      getActiveCheckins(),
      getUpcomingBookings(5),
      getTodaysCapacityUsage(),
    ]);

    if (dogsResult.error) {
      setError(dogsResult.error.message);
      setDogs([]);
      setCheckedInCount(0);
      setUpcomingBookings([]);
      setCapacityUsage(null);
      setLoading(false);
      return;
    }

    if (checkinsResult.error) {
      setError(checkinsResult.error.message);
      setDogs([]);
      setCheckedInCount(0);
      setUpcomingBookings([]);
      setCapacityUsage(null);
      setLoading(false);
      return;
    }

    setDogs(dogsResult.data);
    setCheckedInCount(checkinsResult.data.length);
    setUpcomingBookings(bookingsResult.error ? [] : bookingsResult.data);
    setCapacityUsage(capacityResult.error ? null : capacityResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const base = getDashboardStats(dogs);
    return {
      ...base,
      checkedIn: checkedInCount,
    };
  }, [dogs, checkedInCount]);

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
        const result = await checkInDog(id);
        if (result.error) {
          setActionError(result.error.message);
        } else {
          const updated = enrichDogWithCheckin(dog, result.data);
          setDogs((prev) =>
            prev.map((item) => (item.id === id ? updated : item)),
          );
          setCheckedInCount((count) => count + 1);
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
          setCheckedInCount((count) => Math.max(0, count - 1));
        }
      }

      setTogglingId(null);
    },
    [dogs, togglingId],
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-teal-600"
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
          Good morning!
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

      <Card>
        <CardContent className="space-y-5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Gauge className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-stone-900">Capacity Usage</h3>
                <p className="text-xs text-stone-500">Today&apos;s approved bookings</p>
              </div>
            </div>
            <Link
              href="/settings"
              className="text-sm font-medium text-teal-600 hover:underline"
            >
              Manage
            </Link>
          </div>
          {capacityUsage ? (
            <div className="space-y-4">
              <CapacityUsageBar label="Daycare" usage={capacityUsage.daycare} />
              <CapacityUsageBar label="Boarding" usage={capacityUsage.boarding} />
            </div>
          ) : (
            <p className="text-sm text-stone-500">
              Capacity data unavailable.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-900">
            Upcoming Bookings
          </h3>
          <Link
            href="/bookings"
            className="text-sm font-medium text-teal-600 hover:underline"
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
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
            className="text-sm font-medium text-teal-600 hover:underline"
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
                isToggling={togglingId === dog.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
