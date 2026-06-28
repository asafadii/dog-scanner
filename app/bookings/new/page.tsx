"use client";

import {
  BookingForm,
  type BookingFormSubmitPhase,
} from "@/components/bookings/BookingForm";
import { Button } from "@/components/ui/Button";
import { createBooking, INCOMPLETE_SETUP_MESSAGE } from "@/lib/bookings";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get("clientId");
  const [error, setError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<BookingFormSubmitPhase>("idle");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          New Booking
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Schedule daycare or boarding for a client&apos;s dog.
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
        initialClientId={initialClientId}
        submitPhase={submitPhase}
        onSubmit={async (data) => {
          if (submitPhase !== "idle") return;

          if (data.endDate < data.startDate) {
            setError("End date must be on or after start date.");
            return;
          }

          setError(null);
          setSubmitPhase("saving");

          const result = await createBooking(data);
          if (result.error) {
            setError(result.error.message);
            setSubmitPhase("idle");
            return;
          }

          router.push(`/bookings/${result.data.id}`);
          router.refresh();
        }}
        submitLabel="Create Booking"
      />

      {error === INCOMPLETE_SETUP_MESSAGE && (
        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/bookings")}>
            Go to Settings
          </Button>
        </div>
      )}
    </div>
  );
}
