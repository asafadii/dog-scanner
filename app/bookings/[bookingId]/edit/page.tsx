"use client";

import {
  BookingForm,
  type BookingFormSubmitPhase,
} from "@/components/bookings/BookingForm";
import { SeriesCancelDialog } from "@/components/bookings/SeriesCancelDialog";
import { Button } from "@/components/ui/Button";
import {
  bookingToFormData,
  editBookingSeries,
  getBookingById,
  INCOMPLETE_SETUP_MESSAGE,
  updateBooking,
} from "@/lib/bookings";
import type {
  Booking,
  BookingFormData,
  BookingSeriesCancelScope,
} from "@/lib/types";
import { formatBookingDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function seriesOccurrenceFieldsChanged(
  original: BookingFormData,
  next: BookingFormData,
): boolean {
  return (
    (original.arrivalTime ?? "") !== (next.arrivalTime ?? "") ||
    (original.endTime ?? "") !== (next.endTime ?? "") ||
    original.transportRequired !== next.transportRequired ||
    (original.notes ?? "") !== (next.notes ?? "")
  );
}

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<BookingFormSubmitPhase>("idle");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [initialData, setInitialData] = useState<BookingFormData | null>(null);
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(
    null,
  );
  const [chooserOpen, setChooserOpen] = useState(false);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getBookingById(bookingId);
    if (result.error) {
      setError(result.error.message);
      setBooking(null);
      setInitialData(null);
    } else {
      setBooking(result.data);
      setInitialData(bookingToFormData(result.data));
    }

    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  function redirectAfterSave(result?: {
    updatedCount: number;
    skippedCount: number;
  }) {
    const params = new URLSearchParams();
    if (result) {
      params.set("updated", String(result.updatedCount));
      params.set("skipped", String(result.skippedCount));
    }
    const query = params.toString();
    router.push(
      query ? `/bookings/${bookingId}?${query}` : `/bookings/${bookingId}`,
    );
    router.refresh();
  }

  async function saveSingleOccurrence(
    formData: BookingFormData,
    seriesResult?: { updatedCount: number; skippedCount: number },
  ) {
    setSubmitPhase("saving");
    const result = await updateBooking(bookingId, formData);
    if (result.error) {
      setError(result.error.message);
      setSubmitPhase("idle");
      return;
    }
    redirectAfterSave(seriesResult);
  }

  async function handleSubmit(data: BookingFormData | BookingFormData[]) {
    if (submitPhase !== "idle") return;

    const formData = Array.isArray(data) ? data[0] : data;
    if (!formData) return;

    if (formData.endDate < formData.startDate) {
      setError("End date must be on or after start date.");
      return;
    }

    setError(null);

    if (
      booking?.seriesId &&
      initialData &&
      seriesOccurrenceFieldsChanged(initialData, formData)
    ) {
      setPendingFormData(formData);
      setChooserOpen(true);
      return;
    }

    await saveSingleOccurrence(formData);
  }

  async function handleSeriesEdit(scope: BookingSeriesCancelScope) {
    if (!pendingFormData || submitPhase !== "idle") return;

    setChooserOpen(false);

    if (scope === "this") {
      await saveSingleOccurrence(pendingFormData, {
        updatedCount: 1,
        skippedCount: 0,
      });
      return;
    }

    setSubmitPhase("saving");
    const result = await editBookingSeries(bookingId, scope, {
      arrivalTime: pendingFormData.arrivalTime ?? "",
      endTime: pendingFormData.endTime ?? "",
      transportRequired: pendingFormData.transportRequired,
      notes: pendingFormData.notes,
    });

    if (result.error) {
      setError(result.error.message);
      setSubmitPhase("idle");
      return;
    }

    redirectAfterSave(result.data);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading booking...</p>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button variant="outline" onClick={() => void loadBooking()}>
            Try again
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/bookings")}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Edit Booking
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update booking details. Status changes are managed on the detail page.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      <BookingForm
        initialData={initialData}
        submitPhase={submitPhase}
        submitLabel="Save Changes"
        lockDates={Boolean(booking?.seriesId)}
        onSubmit={(data) => void handleSubmit(data)}
      />

      <SeriesCancelDialog
        open={chooserOpen}
        action="edit"
        dateLabel={formatBookingDate(
          pendingFormData?.startDate ?? booking?.startDate ?? "",
        )}
        submitting={submitPhase !== "idle"}
        onSelect={(scope) => void handleSeriesEdit(scope)}
        onClose={() => {
          if (submitPhase === "idle") {
            setChooserOpen(false);
            setPendingFormData(null);
          }
        }}
      />
    </div>
  );
}
