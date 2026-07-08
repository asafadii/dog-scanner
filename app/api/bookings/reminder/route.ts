import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import { mapBookingRowToBooking } from "@/lib/bookings";
import { buildBookingReminderHtml, formatEmailDate } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  BookingRow,
  ClientRow,
  DogRow,
  FacilityRow,
} from "@/lib/supabase/types";
import { NextResponse } from "next/server";

// Required Netlify env: CRON_SECRET
// Register at cron-job.org to hit this endpoint daily at 09:00 UTC
// with header x-cron-secret: [your secret]

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

function tomorrowUtcDateString(): string {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return tomorrow.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get("x-cron-secret") !== cronSecret
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const tomorrow = tomorrowUtcDateString();
  const { data: bookings, error } = await db
    .from("bookings")
    .select("*")
    .eq("status", "approved")
    .eq("start_date", tomorrow);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const row of (bookings ?? []) as BookingRow[]) {
    const [clientResult, dogResult, facilityResult] = await Promise.all([
      db
        .from("clients")
        .select("name, email")
        .eq("id", row.client_id)
        .eq("facility_id", row.facility_id)
        .maybeSingle(),
      db
        .from("dogs")
        .select("name, breed, photo_url")
        .eq("id", row.dog_id)
        .eq("facility_id", row.facility_id)
        .maybeSingle(),
      db
        .from("facilities")
        .select("name")
        .eq("id", row.facility_id)
        .maybeSingle(),
    ]);

    const client = clientResult.data as Pick<ClientRow, "name" | "email"> | null;
    const dog = dogResult.data as Pick<
      DogRow,
      "name" | "breed" | "photo_url"
    > | null;
    const facility = facilityResult.data as Pick<FacilityRow, "name"> | null;

    if (!client?.email?.trim() || !dog) {
      continue;
    }

    const booking = mapBookingRowToBooking(
      row,
      client.name,
      dog.name,
      dog.breed,
      dog.photo_url,
    );

    await sendTransactionalEmail({
      to: client.email,
      subject: `${dog.name}'s visit is tomorrow 🐶`,
      html: buildBookingReminderHtml({
        clientName: client.name,
        dogName: dog.name,
        facilityName: facility?.name ?? "your daycare",
        startDate: formatEmailDate(booking.startDate),
        portalUrl: `${APP_URL}/portal/bookings/${booking.id}`,
      }),
    });

    sent += 1;
  }

  return NextResponse.json({ sent });
}
