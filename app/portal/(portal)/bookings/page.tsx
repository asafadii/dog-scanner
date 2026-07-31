"use client";

import { PortalBookingCard } from "@/components/portal/PortalBookingCard";
import {
  buildFacilityOptions,
  type FacilityOption,
} from "@/components/portal/PortalFacilityPicker";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getLinkedClients } from "@/lib/portal/auth";
import { getPortalBookings } from "@/lib/portal/bookings";
import type { Booking } from "@/lib/types";
import { CalendarPlus, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function bookingOverlapsDateRange(
  booking: Booking,
  fromDate: string,
  toDate: string,
): boolean {
  if (fromDate && booking.endDate < fromDate) return false;
  if (toDate && booking.startDate > toDate) return false;
  return true;
}

export default function PortalBookingsPage() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get("clientId") ?? "";
  const initialFacilityId = searchParams.get("facilityId") ?? "";

  const [facility, setFacility] = useState<FacilityOption | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      const linkedResult = await getLinkedClients();
      if (cancelled) return;

      if (linkedResult.error) {
        setError(linkedResult.error.message);
        setFacility(null);
        setBookings([]);
        setLoading(false);
        return;
      }

      const options = buildFacilityOptions(linkedResult.data);
      const matched =
        options.find(
          (option) =>
            option.facilityId === initialFacilityId &&
            option.clientId === initialClientId,
        ) ??
        options.find((option) => option.facilityId === initialFacilityId) ??
        options[0] ??
        null;

      if (!matched) {
        setError("Missing daycare context. Go back to the portal and try again.");
        setFacility(null);
        setBookings([]);
        setLoading(false);
        return;
      }

      setFacility(matched);

      const bookingsResult = await getPortalBookings(
        matched.clientId,
        matched.facilityId,
      );
      if (cancelled) return;

      if (bookingsResult.error) {
        setError(bookingsResult.error.message);
        setBookings([]);
      } else {
        setBookings(bookingsResult.data);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialClientId, initialFacilityId]);

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        bookingOverlapsDateRange(booking, fromDate, toDate),
      ),
    [bookings, fromDate, toDate],
  );

  const newBookingHref = facility
    ? `/portal/bookings/new?clientId=${encodeURIComponent(facility.clientId)}&facilityId=${encodeURIComponent(facility.facilityId)}`
    : "/portal/bookings/new";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
          {error ?? "Unable to load bookings."}
        </p>
        <Link href="/portal">
          <Button variant="outline">Back to Portal</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to Portal
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <CalendarPlus className="h-6 w-6 text-primary" aria-hidden />
              Your Bookings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {facility.facilityName}
            </p>
          </div>
          <Link href={newBookingHref}>
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden />
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Input
            label="From date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate || undefined}
          />
          <Input
            label="To date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate || undefined}
          />
        </CardContent>
      </Card>

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {bookings.length === 0
              ? "No bookings yet. Request a stay when you're ready."
              : "No bookings match this date range."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <PortalBookingCard
              key={booking.id}
              booking={booking}
              clientId={facility.clientId}
              facilityId={facility.facilityId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
