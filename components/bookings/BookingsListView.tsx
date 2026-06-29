"use client";

import { BookingCard } from "@/components/bookings/BookingCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getBookings, INCOMPLETE_SETUP_MESSAGE } from "@/lib/bookings";
import { fadeIn } from "@/lib/motion";
import type { Booking, BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type StatusFilter = "all" | BookingStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
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
        <Loader2
          className="h-8 w-8 animate-spin text-[oklch(0.531_0.092_185.0)]"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading bookings...</p>
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
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Bookings
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {filtered.length} of {bookings.length} bookings
          </p>
          <Link
            href="/dogs"
            className="mt-2 inline-block text-sm font-medium text-[oklch(0.531_0.092_185.0)] hover:underline"
          >
            View all dog profiles
          </Link>
        </div>
        <Link href="/bookings/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden />
            New Booking
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
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
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={statusFilter === value}
            onClick={() => setStatusFilter(value)}
            className={cn(
              "min-h-[44px] shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === value
                ? "border-[oklch(0.531_0.092_185.0)] bg-[#F0FAF9] text-[oklch(0.420_0.075_185.0)]"
                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
          <p className="text-stone-600">No bookings yet.</p>
          <Link
            href="/bookings/new"
            className="mt-3 inline-block text-sm font-medium text-[oklch(0.531_0.092_185.0)] hover:underline"
          >
            Create your first booking
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
          <p className="text-stone-600">No bookings match this filter.</p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setSearchQuery("");
              setDateFilter("");
            }}
            className="mt-2 text-sm font-medium text-[oklch(0.531_0.092_185.0)] hover:underline"
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
