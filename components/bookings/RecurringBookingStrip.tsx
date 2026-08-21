"use client";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRecurringBookingSummary } from "@/lib/recurrence";
import type { Booking, BookingSeries } from "@/lib/types";
import { formatBookingDate } from "@/lib/utils";
import { Repeat } from "lucide-react";
import { useEffect, useState } from "react";

type SeriesLoadResult =
  | { data: { series: BookingSeries; occurrences: Booking[] }; error: null }
  | { data: null; error: { message: string } };

interface RecurringBookingStripProps {
  seriesId: string;
  load: (seriesId: string) => Promise<SeriesLoadResult>;
}

export function RecurringBookingStrip({
  seriesId,
  load,
}: RecurringBookingStripProps) {
  const [series, setSeries] = useState<BookingSeries | null>(null);
  const [occurrences, setOccurrences] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await load(seriesId);
      if (cancelled) return;

      if (result.error) {
        setError(result.error.message);
        setSeries(null);
        setOccurrences([]);
        return;
      }

      setError(null);
      setSeries(result.data.series);
      setOccurrences(result.data.occurrences);
    })();

    return () => {
      cancelled = true;
    };
  }, [load, seriesId]);

  if (error || !series) return null;

  const pattern = formatRecurringBookingSummary({
    recurrenceFreq: series.recurrenceFreq,
    recurrenceDaysOfWeek: series.recurrenceDaysOfWeek,
    recurrenceEndDate: series.recurrenceEndDate,
    occurrenceCount: occurrences.length,
  });

  return (
    <Card className="border-t-4 border-t-mint">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="h-5 w-5 text-primary" aria-hidden />
          Recurring booking
        </CardTitle>
        {pattern && (
          <p className="text-sm text-muted-foreground">{pattern}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {occurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visits in this series.</p>
        ) : (
          <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {occurrences.map((occurrence) => (
              <li
                key={occurrence.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <span className="text-sm text-foreground">
                  {formatBookingDate(occurrence.startDate)}
                  {occurrence.startDate !== occurrence.endDate
                    ? ` – ${formatBookingDate(occurrence.endDate)}`
                    : ""}
                </span>
                <BookingStatusBadge status={occurrence.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
