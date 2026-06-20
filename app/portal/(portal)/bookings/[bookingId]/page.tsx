"use client";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getPortalBookingById } from "@/lib/portal/bookings";
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
      <p className="text-sm text-red-800" role="alert">
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

  const generateToken = useCallback(async () => {
    setTokenLoading(true);
    setTokenError(null);

    try {
      const result = await requestCheckinToken(bookingId);
      setToken(result.token);
      setExpiresAt(result.expiresAt);

      const dataUrl = await QRCode.toDataURL(result.token, {
        margin: 2,
        width: 280,
        color: { dark: "#5b21b6", light: "#ffffff" },
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
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
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
        <Link href="/portal">
          <Button variant="outline">Back to Portal</Button>
        </Link>
      </div>
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal"
          className="text-sm font-medium text-violet-600 hover:underline"
        >
          Back to Portal
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900">
          {booking.dogName}
        </h1>
        <p className="mt-1 text-sm text-stone-500">{booking.dogBreed}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Booking details</span>
            <BookingStatusBadge status={booking.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-stone-600">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-stone-400" aria-hidden />
            {formatBookingDateRange(booking.startDate, booking.endDate)}
          </p>
          <p>
            <span className="font-medium text-stone-700">Service:</span>{" "}
            {booking.serviceType === "daycare" ? "Daycare" : "Boarding"}
          </p>
          {booking.transportRequired && (
            <p className="text-stone-500">Transport required</p>
          )}
          {booking.notes && (
            <p className="whitespace-pre-wrap text-stone-700">{booking.notes}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-violet-600" aria-hidden />
            Check In
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!checkInAvailable ? (
            <p className="text-sm text-stone-500">
              {getCheckInUnavailableMessage(
                booking.status,
                booking.startDate,
                booking.endDate,
              )}
            </p>
          ) : !token || tokenExpired ? (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">
                Generate a one-time QR code for staff to scan when you arrive.
                Codes expire after 5 minutes.
              </p>
              {tokenError && (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {tokenError}
                </p>
              )}
              <Button
                size="lg"
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
                  className="rounded-2xl border border-violet-100 bg-white p-3"
                  width={280}
                  height={280}
                />
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  Manual entry code
                </p>
                <p className="mt-2 font-mono text-xl font-semibold tracking-widest text-stone-900">
                  {formatCheckinTokenForDisplay(token)}
                </p>
              </div>
              <p className="text-sm font-medium text-violet-700">
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
