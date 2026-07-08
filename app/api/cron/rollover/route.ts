import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { BookingRow, DogCheckinRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

// Register at cron-job.org — run daily just after midnight (00:05 UTC)
// GET https://hellodora.app/api/cron/rollover
// Header: x-cron-secret: [your CRON_SECRET value]
//
// Note: after registering, also add this to the existing cron-job.org
// account (separate job from the reminder job).

function todayUtcDateString(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
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

  const todayStart = `${todayUtcDateString()}T00:00:00.000Z`;

  const { data: checkins, error: checkinsError } = await db
    .from("dog_checkins")
    .select("id, booking_id, checked_in_at")
    .is("checked_out_at", null)
    .not("booking_id", "is", null)
    .lt("checked_in_at", todayStart);

  if (checkinsError) {
    return NextResponse.json({ error: checkinsError.message }, { status: 500 });
  }

  const activeCheckins = (checkins ?? []) as Pick<
    DogCheckinRow,
    "id" | "booking_id" | "checked_in_at"
  >[];

  if (activeCheckins.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const bookingIds = [
    ...new Set(
      activeCheckins
        .map((checkin) => checkin.booking_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const { data: bookings, error: bookingsError } = await db
    .from("bookings")
    .select("id, service_type")
    .in("id", bookingIds)
    .eq("service_type", "daycare");

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  const daycareBookingIds = (bookings ?? []).map(
    (row) => (row as Pick<BookingRow, "id">).id,
  );

  if (daycareBookingIds.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const { error: updateError } = await db
    .from("bookings")
    .update({
      service_type: "boarding",
      updated_at: new Date().toISOString(),
    })
    .in("id", daycareBookingIds)
    .eq("service_type", "daycare");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ updated: daycareBookingIds.length });
}
