"use client";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRecurringPatternLine } from "@/lib/recurrence";
import type {
  BookingHistorySeriesStatus,
  DogBookingHistoryEntry,
  DogBookingHistoryPage,
} from "@/lib/types";
import { cn, formatBookingDateRange } from "@/lib/utils";
import { Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 2;

type HistoryLoadResult =
  | { data: DogBookingHistoryPage; error: null }
  | { data: null; error: { message: string } };

interface BookingHistorySectionProps {
  loadPage: (offset: number, limit: number) => Promise<HistoryLoadResult>;
  hrefForEntry: (entry: DogBookingHistoryEntry) => string;
  titleClassName?: string;
}

function seriesStatusLabel(status: BookingHistorySeriesStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

function seriesStatusVariant(
  status: BookingHistorySeriesStatus,
): "teal" | "stone" | "default" {
  switch (status) {
    case "active":
      return "teal";
    case "completed":
      return "stone";
    case "cancelled":
      return "default";
  }
}

function HistoryRow({
  entry,
  href,
}: {
  entry: DogBookingHistoryEntry;
  href: string;
}) {
  const pattern =
    entry.series &&
    formatRecurringPatternLine({
      recurrenceFreq: entry.series.recurrenceFreq,
      recurrenceDaysOfWeek: entry.series.recurrenceDaysOfWeek,
      occurrenceCount: entry.occurrenceCount,
    });

  return (
    <Link
      href={href}
      className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary/40"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {formatBookingDateRange(entry.booking.startDate, entry.booking.endDate, {
            arrivalTime: entry.booking.arrivalTime,
            endTime: entry.booking.endTime,
          })}
        </p>
        {pattern && (
          <p className="mt-0.5 text-xs text-muted-foreground">{pattern}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        <Badge
          variant={entry.booking.serviceType === "daycare" ? "teal" : "violet"}
        >
          {entry.booking.serviceType === "daycare" ? "Daycare" : "Boarding"}
        </Badge>
        {entry.series && entry.seriesStatus ? (
          <Badge
            variant={seriesStatusVariant(entry.seriesStatus)}
            role="status"
            aria-label={`Series status: ${seriesStatusLabel(entry.seriesStatus)}`}
          >
            {seriesStatusLabel(entry.seriesStatus)}
          </Badge>
        ) : (
          <BookingStatusBadge status={entry.booking.status} />
        )}
      </div>
    </Link>
  );
}

export function BookingHistorySection({
  loadPage,
  hrefForEntry,
  titleClassName,
}: BookingHistorySectionProps) {
  const [entries, setEntries] = useState<DogBookingHistoryEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await loadPage(0, PAGE_SIZE);
    if (result.error) {
      setError(result.error.message);
      setEntries([]);
      setHasMore(false);
    } else {
      setEntries(result.data.entries);
      setHasMore(result.data.hasMore);
    }

    setLoading(false);
  }, [loadPage]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function handleShowMore() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    const result = await loadPage(entries.length, PAGE_SIZE);
    if (result.error) {
      setError(result.error.message);
    } else {
      setEntries((current) => [...current, ...result.data.entries]);
      setHasMore(result.data.hasMore);
    }

    setLoadingMore(false);
  }

  return (
    <Card className="border-t-4 border-t-mint">
      <CardHeader className="pb-2">
        <CardTitle className={cn("flex items-center gap-2", titleClassName)}>
          <Calendar className="h-5 w-5 text-primary" aria-hidden />
          Booking History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading bookings...
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <HistoryRow
                key={entry.booking.id}
                entry={entry}
                href={hrefForEntry(entry)}
              />
            ))}
            {hasMore && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loadingMore}
                onClick={() => void handleShowMore()}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading more...
                  </>
                ) : (
                  "Show more"
                )}
              </Button>
            )}
          </div>
        )}
        {error && !loading && (
          <p className="mt-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
