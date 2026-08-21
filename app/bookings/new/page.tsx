"use client";

import {
  BookingForm,
  type BookingFormSubmitPhase,
} from "@/components/bookings/BookingForm";
import { Button } from "@/components/ui/Button";
import { createBookings, createRecurringBooking, INCOMPLETE_SETUP_MESSAGE } from "@/lib/bookings";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BookingFormData } from "@/lib/types";
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          New Booking
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Schedule daycare or boarding for a client&apos;s dog.
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
        initialClientId={initialClientId}
        submitPhase={submitPhase}
        onSubmitRecurring={async (input) => {
          if (submitPhase !== "idle") return;

          setError(null);
          setSubmitPhase("saving");

          const result = await createRecurringBooking(input);
          if (result.error) {
            setError(result.error.message);
            setSubmitPhase("idle");
            return;
          }

          router.push("/bookings");
          router.refresh();
        }}
        onSubmit={async (data) => {
          if (submitPhase !== "idle") return;

          const rows = Array.isArray(data) ? data : [data];

          for (const row of rows) {
            if (row.endDate < row.startDate) {
              setError("End date must be on or after start date.");
              return;
            }
          }

          setError(null);
          setSubmitPhase("saving");

          if (rows.length > 1) {
            const result = await createBookings(rows);
            if (result.error) {
              setError(result.error.message);
              setSubmitPhase("idle");
              return;
            }

            router.push("/bookings");
            router.refresh();
            return;
          }

          const single = rows[0];
          const supabase = createSupabaseBrowserClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          const accessToken = session?.access_token;
          if (!accessToken) {
            setError("Not signed in");
            setSubmitPhase("idle");
            return;
          }

          const response = await fetch("/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(single satisfies BookingFormData),
          });

          const result = (await response.json()) as
            | { ok: true; data: { id: string } }
            | { ok: false; error: string };

          if (!response.ok || !result.ok) {
            setError(!result.ok ? result.error : "Failed to create booking");
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
          <Button variant="outline" onClick={() => router.push("/settings")}>
            Go to Settings
          </Button>
        </div>
      )}
    </div>
  );
}
