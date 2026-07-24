"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { CapacityCalendar } from "@/components/capacity/CapacityCalendar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { StatCard, type StatCardAccent } from "@/components/ui/StatCard";
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
  Dog as DogIcon,
  Loader2,
  LogIn,
  Moon,
  Sun,
} from "lucide-react";
import { fadeIn, appearScale, slideUp } from "@/lib/motion";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STAT_CONFIG = [
  {
    key: "checkedIn" as const,
    label: "Checked In",
    icon: ClipboardCheck,
    href: "/checkins",
  },
  {
    key: "arrivalsToday" as const,
    label: "Arrivals Today",
    icon: LogIn,
    href: "/checkins",
  },
  {
    key: "daycareToday" as const,
    label: "Daycare Today",
    icon: Sun,
    href: "/checkins",
  },
  {
    key: "overnight" as const,
    label: "Overnight",
    icon: Moon,
    href: "/checkins",
  },
];

const STAT_ACCENTS: StatCardAccent[] = ["marker", "marker-light", "default", "default"];

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
                activeBookingId: null,
                serviceType: null,
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

  const handleServiceTypeChange = useCallback(
    (dogId: string, serviceType: Booking["serviceType"]) => {
      setDogs((prev) =>
        prev.map((item) =>
          item.id === dogId ? { ...item, serviceType } : item,
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
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/25 bg-[#FEF2F2] px-6 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
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
    <motion.div className="space-y-8" {...fadeIn}>
      <div>
        <h2 className="font-display text-2xl tracking-tight text-foreground">
          {getTimeBasedGreeting()}!
        </h2>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening at the facility today.
        </p>
      </div>

      <AnimatePresence>
        {actionError && (
          <motion.div
            key="action-error"
            {...slideUp}
            className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {actionError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, href }, index) => (
          <motion.div
            key={key}
            {...appearScale}
            transition={{ ...appearScale.transition, delay: index * 0.05 }}
          >
            <Link href={href}>
              <StatCard
                className="tabular-nums transition-shadow hover:shadow-md"
                accent={STAT_ACCENTS[index]}
                value={stats[key]}
                label={label}
                icon={<Icon className="h-5 w-5" aria-hidden />}
              />
            </Link>
          </motion.div>
        ))}
      </div>

      <CapacityCalendar />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-foreground">
            Upcoming Bookings
          </h3>
          <Link
            href="/bookings"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No upcoming bookings scheduled.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* mint-wash icon chip (#EAF4F1) — documented D-04 exception, no named token */}
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint-wash text-primary">
                      <CalendarDays className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {booking.dogName}
                        </p>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
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
          <h3 className="font-display text-lg text-foreground">
            Currently Checked In
          </h3>
          <Link
            href="/checkins"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {checkedInDogs.length === 0 ? (
          <Card className="border-t-4 border-t-marker">
            <CardContent className="py-10 text-center">
              <div className="mx-auto mb-3 flex w-fit rounded-xl bg-marker/20 p-3 text-[#5a4a1e]">
                <DogIcon className="h-6 w-6" aria-hidden />
              </div>
              <p className="text-muted-foreground">No dogs checked in right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {checkedInDogs.map((dog) => (
              <DogCard
                key={dog.id}
                dog={dog}
                onCheckToggle={(dogId) => void toggleCheckStatus(dogId)}
                onCheckoutComplete={handleCheckoutComplete}
                onServiceTypeChange={handleServiceTypeChange}
                isToggling={togglingId === dog.id}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
