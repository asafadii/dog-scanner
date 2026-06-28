"use client";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { Button } from "@/components/ui/Button";
import type { Booking } from "@/lib/types";
import { cn, formatBookingDateRange } from "@/lib/utils";
import { Calendar, Eye, PawPrint, User } from "lucide-react";
import Link from "next/link";

interface BookingCardProps {
  booking: Booking;
  className?: string;
}

function formatServiceType(serviceType: Booking["serviceType"]): string {
  return serviceType === "daycare" ? "Daycare" : "Boarding";
}

export function BookingCard({ booking, className }: BookingCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
      aria-label={`Booking for ${booking.dogName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PawPrint className="h-4 w-4 shrink-0 text-[oklch(0.531_0.092_185.0)]" aria-hidden />
            <h3 className="truncate text-lg font-semibold text-stone-900">
              {booking.dogName}
            </h3>
          </div>
          <p className="mt-0.5 truncate text-sm text-stone-500">
            {booking.dogBreed}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-stone-600">
        <p className="flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
          <span className="truncate">{booking.clientName}</span>
        </p>
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
          <span>{formatBookingDateRange(booking.startDate, booking.endDate)}</span>
        </p>
        <p>
          <span className="font-medium text-stone-700">Service:</span>{" "}
          {formatServiceType(booking.serviceType)}
          {booking.transportRequired && (
            <span className="text-stone-500"> · Transport required</span>
          )}
        </p>
      </div>

      <div className="mt-4 border-t border-stone-100 pt-3">
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
