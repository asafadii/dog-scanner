"use client";

import {
  useFacilityAccess,
  WRITE_LOCKED_TITLE,
} from "@/components/app/FacilityAccessContext";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { DogSnapshotCard } from "@/components/dogs/DogSnapshotCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getBookingById,
  INCOMPLETE_SETUP_MESSAGE,
} from "@/lib/bookings";
import { canApproveBooking } from "@/lib/capacity";
import { checkInDog, getDogActiveCheckin } from "@/lib/checkins";
import { slideUp } from "@/lib/motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Booking } from "@/lib/types";
import { formatBookingDateRange } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
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
  const { accessLevel } = useFacilityAccess();
  const writeLocked = accessLevel !== "full";
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
    status: "approved" | "rejected" | "completed" | "cancelled",
  ) {
    if (!booking || updating) return;

    if (status === "cancelled") {
      const confirmed = window.confirm(
        "Cancel this booking? The client will be notified by email.",
      );
      if (!confirmed) return;
    }

    setUpdating(true);
    setActionError(null);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      setActionError("Not signed in");
      setUpdating(false);
      return;
    }

    const response = await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status }),
    });

    const result = (await response.json()) as
      | { ok: true; data: Booking }
      | { ok: false; error: string };

    if (!response.ok || !result.ok) {
      setActionError(!result.ok ? result.error : "Failed to update booking");
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading booking...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
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
            className="text-sm font-medium text-primary hover:underline"
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
  const canCancel =
    booking.status === "pending" || booking.status === "approved";
  const canCheckIn = booking.status === "approved" && !dogCheckedIn;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {booking.dogName}
            </h2>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatServiceType(booking.serviceType)} booking
          </p>
        </div>
        {writeLocked ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled
            title={WRITE_LOCKED_TITLE}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit Booking
          </Button>
        ) : (
          <Link href={`/bookings/${bookingId}/edit`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit Booking
            </Button>
          </Link>
        )}
      </div>

      <AnimatePresence>
        {actionError && (
          <motion.div
            key="action-error"
            {...slideUp}
            // Alert error tint #FEF2F2 — documented D-04 exception (Alert.tsx precedent)
            className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {actionError}
          </motion.div>
        )}
      </AnimatePresence>

      <DogSnapshotCard
        dogName={booking.dogName}
        dogBreed={booking.dogBreed}
        dogPhotoUrl={booking.dogPhotoUrl}
        viewProfileUrl={`/dogs/${booking.dogId}`}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <PawPrint className="h-4 w-4" aria-hidden />
              Dog
            </span>
            <Link
              href={`/dogs/${booking.dogId}`}
              className="font-medium text-primary hover:underline"
            >
              {booking.dogName}
            </Link>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" aria-hidden />
              Client
            </span>
            <Link
              href={`/clients/${booking.clientId}`}
              className="font-medium text-primary hover:underline"
            >
              {booking.clientName}
            </Link>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" aria-hidden />
              Dates
            </span>
            <span className="font-medium text-foreground">
              {formatBookingDateRange(booking.startDate, booking.endDate)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium capitalize text-foreground">
              {booking.serviceType}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Car className="h-4 w-4" aria-hidden />
              Transport
            </span>
            <span className="font-medium text-foreground">
              {booking.transportRequired ? "Required" : "Not required"}
            </span>
          </div>
          {booking.notes && (
            <div className="border-t border-border pt-3">
              <p className="text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">
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
            <p className="text-sm text-muted-foreground">
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
          // Alert success tint #ECFDF5 — documented D-04 exception (Alert.tsx precedent)
          className="flex items-center gap-2 rounded-xl border border-success/25 bg-[#ECFDF5] px-4 py-3 text-sm font-medium text-success"
          role="status"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {booking.dogName} is checked in for this booking.
        </div>
      )}

      {(canApprove || canReject || canComplete || canCancel) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {canApprove && capacityMessage && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  capacityBlocked
                    ? // Alert warning tint #FFFBEB — documented D-04 exception (Alert.tsx precedent)
                      "border-warning/25 bg-[#FFFBEB] text-warning"
                    : "border-border bg-muted text-muted-foreground"
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
            {canCancel && (
              <Button
                variant="outline"
                className="flex-1 border-danger/40 text-danger hover:bg-danger/10"
                disabled={updating}
                onClick={() => void handleStatusChange("cancelled")}
              >
                Cancel Booking
              </Button>
            )}
            </div>
          </CardContent>
        </Card>
      )}

      <BookingStatusFlow status={booking.status} checkedIn={dogCheckedIn} />
    </div>
  );
}

const STATUS_FLOW: { key: string; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "checked_in", label: "Checked in" },
  { key: "completed", label: "Completed" },
];

// Maps a booking to the currently-active node in the linear status flow.
function activeFlowIndex(status: Booking["status"], checkedIn: boolean): number {
  if (status === "completed") return 3;
  if (status === "approved") return checkedIn ? 2 : 1;
  if (
    status === "rejected" ||
    status === "cancelled" ||
    status === "pending"
  ) {
    return 0;
  }
  return 0;
}

// Status-flow strip (design 787-838): dashed operational container + linear
// status pills. The active node reuses the BookingStatusBadge palette (teal for
// the reached step); upcoming nodes are neutral border pills.
function BookingStatusFlow({
  status,
  checkedIn,
}: {
  status: Booking["status"];
  checkedIn: boolean;
}) {
  const activeIdx = activeFlowIndex(status, checkedIn);

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Status flow
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        {STATUS_FLOW.map((step, idx) => (
          <div key={step.key} className="flex items-center gap-2">
            <span
              className={
                idx <= activeIdx
                  ? "rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary"
                  : "rounded-full border border-border bg-surface px-2.5 py-1 text-muted-foreground"
              }
            >
              {step.label}
            </span>
            {idx < STATUS_FLOW.length - 1 && (
              <span aria-hidden className="text-muted-foreground">
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
