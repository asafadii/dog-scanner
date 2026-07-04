"use client";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { Button } from "@/components/ui/Button";
import { getDogPhotoSrc } from "@/lib/dogAssets";
import type { Booking } from "@/lib/types";
import { cn, formatBookingDateRange } from "@/lib/utils";
import { Calendar, Eye, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BookingCardProps {
  booking: Booking;
  className?: string;
}

function formatServiceType(serviceType: Booking["serviceType"]): string {
  return serviceType === "daycare" ? "Daycare" : "Boarding";
}

export function BookingCard({ booking, className }: BookingCardProps) {
  const photoSrc = getDogPhotoSrc(booking.dogPhotoUrl);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
      aria-label={`Booking for ${booking.dogName}`}
    >
      <div className="flex items-start gap-3">
        <Image
          src={photoSrc}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-semibold text-foreground">
                {booking.dogName}
              </h3>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {booking.dogBreed}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{booking.clientName}</span>
        </p>
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>{formatBookingDateRange(booking.startDate, booking.endDate)}</span>
        </p>
        <p>
          <span className="font-medium text-foreground">Service:</span>{" "}
          {formatServiceType(booking.serviceType)}
          {booking.transportRequired && (
            <span className="text-muted-foreground"> · Transport required</span>
          )}
        </p>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <Link href={`/bookings/${booking.id}`}>
          <Button variant="outline" size="md" className="w-full">
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
            View Booking
          </Button>
        </Link>
      </div>
    </article>
  );
}
