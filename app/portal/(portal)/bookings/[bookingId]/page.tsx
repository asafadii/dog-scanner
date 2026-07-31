"use client";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  cancelPortalBooking,
  getPortalBookingById,
} from "@/lib/portal/bookings";
import {
  formatCheckinTokenForDisplay,
  getCheckInUnavailableMessage,
  isBookingCheckInAvailableToday,
  requestCheckinToken,
} from "@/lib/portal/checkinToken";
import type { Booking } from "@/lib/types";
import { formatBookingDateRange } from "@/lib/utils";
import { Calendar, Loader2, QrCode } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

export default function PortalBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";
  const facilityId = searchParams.get("facilityId") ?? "";

  if (!clientId || !facilityId) {
    return (
      <p className="text-sm text-danger" role="alert">
        Missing booking context.
      </p>
    );
  }

  return (
    <PortalBookingDetailInner
      bookingId={bookingId}
      clientId={clientId}
      facilityId={facilityId}
    />
  );
}

function PortalBookingDetailInner({
  bookingId,
  clientId,
  facilityId,
}: {
  bookingId: string;
  clientId: string;
  facilityId: string;
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getPortalBookingById(bookingId, clientId, facilityId);
    if (result.error) {
      setError(result.error.message);
      setBooking(null);
    } else {
      setBooking(result.data);
    }

    setLoading(false);
  }, [bookingId, clientId, facilityId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  async function handleCancelBooking() {
    if (!booking || cancelling) return;

    const confirmed = window.confirm(
      "Cancel this booking? The facility will be notified by email.",
    );
    if (!confirmed) return;

    setCancelling(true);
    setCancelError(null);

    const result = await cancelPortalBooking(bookingId);
    if (result.error) {
      setCancelError(result.error.message);
    } else {
      setBooking({
        ...booking,
        status: "cancelled",
        cancelledBy: "client",
      });
    }

    setCancelling(false);
  }

  const generateToken = useCallback(async () => {
    setTokenLoading(true);
    setTokenError(null);

    try {
      const result = await requestCheckinToken(bookingId);
      setToken(result.token);
      setExpiresAt(result.expiresAt);

      const APP_URL =
        process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";
      const qrPayload = `${APP_URL}/checkins/scan?token=${encodeURIComponent(result.token)}`;
      const dataUrl = await QRCode.toDataURL(qrPayload, {
        margin: 2,
        width: 280,
        // Mint brand ink for the QR modules (documented brand literal #06342F); light stays white
        color: { dark: "#06342F", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      setToken(null);
      setExpiresAt(null);
      setQrDataUrl(null);
      setTokenError(
        err instanceof Error ? err.message : "Failed to generate check-in code.",
      );
    } finally {
      setTokenLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsRemaining(0);
      return;
    }

    function tick() {
      const remaining = Math.max(
        0,
        Math.floor((new Date(expiresAt!).getTime() - Date.now()) / 1000),
      );
      setSecondsRemaining(remaining);
    }

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const tokenExpired = Boolean(token && secondsRemaining <= 0);
  const checkInAvailable =
    booking &&
    isBookingCheckInAvailableToday(
      booking.status,
      booking.startDate,
      booking.endDate,
    );

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
        <Link href="/portal">
          <Button variant="outline">Back to Portal</Button>
        </Link>
      </div>
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const canCancel =
    booking.status === "pending" || booking.status === "approved";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to Portal
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {booking.dogName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{booking.dogBreed}</p>
      </div>

      {cancelError && (
        <p
          className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {cancelError}
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Booking details</span>
            <BookingStatusBadge status={booking.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
            {formatBookingDateRange(booking.startDate, booking.endDate)}
          </p>
          <p>
            <span className="font-medium text-foreground">Service:</span>{" "}
            {booking.serviceType === "daycare" ? "Daycare" : "Boarding"}
          </p>
          {booking.transportRequired && (
            <p className="text-muted-foreground">Transport required</p>
          )}
          {booking.notes && (
            <p className="whitespace-pre-wrap text-foreground">{booking.notes}</p>
          )}
        </CardContent>
      </Card>

      {canCancel && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Manage booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-muted-foreground">
              Need to cancel? You can cancel this booking while it is still
              pending or approved.
            </p>
            <Button
              variant="outline"
              className="border-danger/40 text-danger hover:bg-danger/10"
              disabled={cancelling}
              onClick={() => void handleCancelBooking()}
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {cancelling ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-primary" aria-hidden />
            Check In
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!checkInAvailable ? (
            <p className="text-sm text-muted-foreground">
              {getCheckInUnavailableMessage(
                booking.status,
                booking.startDate,
                booking.endDate,
              )}
            </p>
          ) : !token || tokenExpired ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a one-time QR code for staff to scan when you arrive.
                Codes expire after 5 minutes.
              </p>
              {tokenError && (
                <p
                  className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                  role="alert"
                >
                  {tokenError}
                </p>
              )}
              {/* Documented portal sticker exception (Plan 05): primary CTA only —
                  border 2.5px + shadow 4px 4px 0 #06342F. Nowhere else, never in staff app. */}
              <Button
                size="lg"
                className="border-[2.5px] border-[#06342F] shadow-[4px_4px_0_#06342F] disabled:shadow-none"
                disabled={tokenLoading}
                onClick={() => void generateToken()}
              >
                {tokenLoading
                  ? "Generating..."
                  : tokenExpired
                    ? "Generate new code"
                    : "Generate check-in code"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Check-in QR code"
                  className="rounded-2xl border border-border bg-surface p-3"
                  width={280}
                  height={280}
                />
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Manual entry code
                </p>
                <p className="mt-2 font-mono text-xl font-semibold tracking-widest text-foreground">
                  {formatCheckinTokenForDisplay(token)}
                </p>
              </div>
              <p className="text-sm font-medium text-primary">
                Expires in {minutes}:{String(seconds).padStart(2, "0")}
              </p>
              <Button
                variant="outline"
                disabled={tokenLoading}
                onClick={() => void generateToken()}
              >
                Generate new code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
