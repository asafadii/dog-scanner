import { randomBytes } from "crypto";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import type { CheckinTokenSuccessResponse } from "@/lib/portal/checkinToken";
import { NextResponse } from "next/server";

interface CheckinTokenBody {
  bookingId?: string;
}

const CHECKIN_UNAVAILABLE_MESSAGE =
  "This booking is not approved for check-in today.";
const TOKEN_TTL_MS = 5 * 60 * 1000;

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isBookingActiveToday(startDate: string, endDate: string): boolean {
  const today = todayDateString();
  return startDate <= today && endDate >= today;
}

export async function POST(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;

  let body: CheckinTokenBody = {};
  try {
    body = (await request.json()) as CheckinTokenBody;
  } catch {
    body = {};
  }

  const bookingId = body.bookingId?.trim();
  if (!bookingId) {
    return NextResponse.json(
      { ok: false, error: "bookingId is required" },
      { status: 400 },
    );
  }

  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .select("id, client_id, facility_id, dog_id, status, start_date, end_date")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json(
      { ok: false, error: bookingError.message },
      { status: 500 },
    );
  }

  if (!booking) {
    return NextResponse.json(
      { ok: false, error: CHECKIN_UNAVAILABLE_MESSAGE },
      { status: 403 },
    );
  }

  const linked = await verifyClientAccountLink(
    db,
    user.id,
    booking.client_id,
    booking.facility_id,
  );

  if (
    !linked ||
    booking.status !== "approved" ||
    !isBookingActiveToday(booking.start_date, booking.end_date)
  ) {
    return NextResponse.json(
      { ok: false, error: CHECKIN_UNAVAILABLE_MESSAGE },
      { status: 403 },
    );
  }

  await db
    .from("checkin_tokens")
    .delete()
    .eq("booking_id", bookingId)
    .is("used_at", null);

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const { error: insertError } = await db.from("checkin_tokens").insert({
    token,
    booking_id: booking.id,
    dog_id: booking.dog_id,
    facility_id: booking.facility_id,
    created_by_client_account_id: user.id,
    expires_at: expiresAt,
  });

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: insertError.message },
      { status: 500 },
    );
  }

  const response: CheckinTokenSuccessResponse = {
    ok: true,
    token,
    expiresAt,
  };
  return NextResponse.json(response, { status: 201 });
}
