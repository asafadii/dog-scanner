"use client";

import {
  BookingForm,
  type BookingFormSubmitPhase,
} from "@/components/bookings/BookingForm";
import { Button } from "@/components/ui/Button";
import {
  bookingToFormData,
  getBookingById,
  INCOMPLETE_SETUP_MESSAGE,
  updateBooking,
} from "@/lib/bookings";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<BookingFormSubmitPhase>("idle");
  const [initialData, setInitialData] = useState<ReturnType<
    typeof bookingToFormData
  > | null>(null);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getBookingById(bookingId);
    if (result.error) {
      setError(result.error.message);
      setInitialData(null);
    } else {
      setInitialData(bookingToFormData(result.data));
    }

    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

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

  if (error && !initialData) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-red-800" role="alert">
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
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Edit Booking
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Update booking details. Status changes are managed on the detail page.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <BookingForm
        initialData={initialData}
        submitPhase={submitPhase}
        submitLabel="Save Changes"
        onSubmit={async (data) => {
          if (submitPhase !== "idle") return;

          if (data.endDate < data.startDate) {
            setError("End date must be on or after start date.");
            return;
          }

          setError(null);
          setSubmitPhase("saving");

          const result = await updateBooking(bookingId, data);
          if (result.error) {
            setError(result.error.message);
            setSubmitPhase("idle");
            return;
          }

          router.push(`/bookings/${bookingId}`);
          router.refresh();
        }}
      />
    </div>
  );
}
