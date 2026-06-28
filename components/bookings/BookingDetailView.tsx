"use client";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getBookingById,
  INCOMPLETE_SETUP_MESSAGE,
  updateBooking,
} from "@/lib/bookings";
import { canApproveBooking } from "@/lib/capacity";
import { checkInDog, getDogActiveCheckin } from "@/lib/checkins";
import type { Booking } from "@/lib/types";
import { formatBookingDateRange } from "@/lib/utils";
import {
  Calendar,
  Car,
  Check,
  Loader2,
  LogIn,
  PawPrint,
  Pencil,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface BookingDetailViewProps {
  bookingId: string;
}

function formatServiceType(serviceType: Booking["serviceType"]): string {
  return serviceType === "daycare" ? "Daycare" : "Boarding";
}

export function BookingDetailView({ bookingId }: BookingDetailViewProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [capacityBlocked, setCapacityBlocked] = useState(false);
  const [capacityMessage, setCapacityMessage] = useState<string | null>(null);
  const [dogCheckedIn, setDogCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCapacityBlocked(false);
    setCapacityMessage(null);
    setDogCheckedIn(false);

    const result = await getBookingById(bookingId);
    if (result.error) {
      setError(result.error.message);
      setBooking(null);
    } else {
      setBooking(result.data);

      if (result.data.status === "pending") {
        const approvalCheck = await canApproveBooking(bookingId);
        if (!approvalCheck.error && approvalCheck.data) {
          setCapacityBlocked(!approvalCheck.data.canApprove);
          setCapacityMessage(approvalCheck.data.message);
        }
      }

      if (result.data.status === "approved") {
        const checkinResult = await getDogActiveCheckin(result.data.dogId);
        if (!checkinResult.error && checkinResult.data) {
          setDogCheckedIn(true);
        }
      }
    }

    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  async function handleStatusChange(
    status: "approved" | "rejected" | "completed",
  ) {
    if (!booking || updating) return;

    setUpdating(true);
    setActionError(null);

    const result = await updateBooking(bookingId, { status });
    if (result.error) {
      setActionError(result.error.message);
    } else {
      setBooking(result.data);
    }

    setUpdating(false);
  }

  async function handleCheckIn() {
    if (!booking || checkingIn || dogCheckedIn) return;

    setCheckingIn(true);
    setActionError(null);

    const result = await checkInDog(booking.dogId, booking.id);
    if (result.error) {
      setActionError(result.error.message);
    } else {
      setDogCheckedIn(true);
    }

    setCheckingIn(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-[oklch(0.531_0.092_185.0)]"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading booking...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-red-800" role="alert">
          {error ?? "Booking not found"}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button variant="outline" onClick={() => void loadBooking()}>
            Try again
          </Button>
        )}
        <div>
          <Link
            href="/bookings"
            className="text-sm font-medium text-[oklch(0.531_0.092_185.0)] hover:underline"
          >
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const canApprove = booking.status === "pending";
  const canReject = booking.status === "pending";
  const canComplete = booking.status === "approved";
  const canCheckIn = booking.status === "approved" && !dogCheckedIn;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              {booking.dogName}
            </h2>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {formatServiceType(booking.serviceType)} booking
          </p>
        </div>
        <Link href={`/bookings/${bookingId}/edit`}>
          <Button variant="outline" className="w-full sm:w-auto">
            <Pencil className="h-4 w-4" aria-hidden />
            Edit Booking
          </Button>
        </Link>
      </div>

      {actionError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {actionError}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-stone-500">
              <PawPrint className="h-4 w-4" aria-hidden />
              Dog
            </span>
            <Link
              href={`/dogs/${booking.dogId}`}
              className="font-medium text-[oklch(0.531_0.092_185.0)] hover:underline"
            >
              {booking.dogName}
            </Link>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-stone-500">
              <User className="h-4 w-4" aria-hidden />
              Client
            </span>
            <Link
              href={`/clients/${booking.clientId}`}
              className="font-medium text-[oklch(0.531_0.092_185.0)] hover:underline"
            >
              {booking.clientName}
            </Link>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-stone-500">
              <Calendar className="h-4 w-4" aria-hidden />
              Dates
            </span>
            <span className="font-medium text-stone-900">
              {formatBookingDateRange(booking.startDate, booking.endDate)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-stone-500">Service</span>
            <span className="font-medium capitalize text-stone-900">
              {booking.serviceType}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-stone-500">
              <Car className="h-4 w-4" aria-hidden />
              Transport
            </span>
            <span className="font-medium text-stone-900">
              {booking.transportRequired ? "Required" : "Not required"}
            </span>
          </div>
          {booking.notes && (
            <div className="border-t border-stone-100 pt-3">
              <p className="text-stone-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-stone-800">
                {booking.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {canCheckIn && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Check In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-stone-600">
              This booking is approved. Check {booking.dogName} in for today&apos;s
              stay.
            </p>
            <Button
              className="w-full sm:w-auto"
              disabled={checkingIn}
              onClick={() => void handleCheckIn()}
            >
              {checkingIn ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <LogIn className="h-4 w-4" aria-hidden />
              )}
              {checkingIn ? "Checking in..." : "Check In"}
            </Button>
          </CardContent>
        </Card>
      )}

      {dogCheckedIn && booking.status === "approved" && (
        <div
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          role="status"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {booking.dogName} is checked in for this booking.
        </div>
      )}

      {(canApprove || canReject || canComplete) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {canApprove && capacityMessage && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  capacityBlocked
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-stone-200 bg-stone-50 text-stone-700"
                }`}
                role="status"
              >
                {capacityMessage}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
            {canApprove && (
              <Button
                className="flex-1"
                disabled={updating || capacityBlocked}
                onClick={() => void handleStatusChange("approved")}
              >
                Approve
              </Button>
            )}
            {canReject && (
              <Button
                variant="danger"
                className="flex-1"
                disabled={updating}
                onClick={() => void handleStatusChange("rejected")}
              >
                Reject
              </Button>
            )}
            {canComplete && (
              <Button
                variant="outline"
                className="flex-1"
                disabled={updating}
                onClick={() => void handleStatusChange("completed")}
              >
                Mark Completed
              </Button>
            )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
