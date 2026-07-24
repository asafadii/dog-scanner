"use client";

import { BookingCard } from "@/components/bookings/BookingCard";
import {
  useFacilityAccess,
  WRITE_LOCKED_TITLE,
} from "@/components/app/FacilityAccessContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pills";
import { getBookings, INCOMPLETE_SETUP_MESSAGE } from "@/lib/bookings";
import { fadeIn } from "@/lib/motion";
import type { Booking, BookingStatus } from "@/lib/types";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type StatusFilter = "all" | BookingStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatServiceType(serviceType: Booking["serviceType"]): string {
  return serviceType === "daycare" ? "Daycare" : "Boarding";
}

function matchesSearch(booking: Booking, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    booking.dogName.toLowerCase().includes(normalized) ||
    booking.clientName.toLowerCase().includes(normalized) ||
    booking.status.toLowerCase().includes(normalized) ||
    formatServiceType(booking.serviceType).toLowerCase().includes(normalized)
  );
}

export function BookingsListView() {
  const { accessLevel } = useFacilityAccess();
  const writeLocked = accessLevel !== "full";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getBookings();
    if (result.error) {
      setError(result.error.message);
      setBookings([]);
    } else {
      setBookings(result.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }
      if (dateFilter && booking.startDate !== dateFilter) {
        return false;
      }
      return matchesSearch(booking, searchQuery);
    });
  }, [bookings, statusFilter, searchQuery, dateFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    // Alert error tint #FEF2F2 — documented D-04 exception (Alert.tsx precedent)
    return (
      <div className="rounded-2xl border border-danger/25 bg-[#FEF2F2] px-6 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void loadBookings()}
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
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Bookings
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {bookings.length} bookings
          </p>
          <Link
            href="/dogs"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            View all dog profiles
          </Link>
        </div>
        {writeLocked ? (
          <Button
            className="w-full sm:w-auto"
            disabled
            title={WRITE_LOCKED_TITLE}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New Booking
          </Button>
        ) : (
          <Link href="/bookings/new">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden />
              New Booking
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Search bookings
          </span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search dog, owner, status, service..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
              aria-label="Search bookings"
            />
          </div>
        </div>
        <Input
          type="date"
          label="Filter by start date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
        />
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Filter bookings by status"
      >
        {FILTER_OPTIONS.map(({ value, label }) => (
          <Pill
            key={value}
            role="tab"
            aria-selected={statusFilter === value}
            variant={statusFilter === value ? "active" : "inactive"}
            onClick={() => setStatusFilter(value)}
            className="min-h-[44px] shrink-0"
          >
            {label}
          </Pill>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border border-t-4 border-t-marker bg-surface py-16 text-center">
          <div className="mx-auto mb-3 flex w-fit rounded-xl bg-marker/20 p-3 text-[#5a4a1e]">
            <CalendarDays className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-muted-foreground">No bookings yet.</p>
          <Link
            href="/bookings/new"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Create your first booking
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border border-t-4 border-t-marker bg-surface py-16 text-center">
          <div className="mx-auto mb-3 flex w-fit rounded-xl bg-marker/20 p-3 text-[#5a4a1e]">
            <Search className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-muted-foreground">No bookings match this filter.</p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setSearchQuery("");
              setDateFilter("");
            }}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <motion.div className="grid gap-4 sm:grid-cols-2" {...fadeIn}>
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
