import { cancelBookingSeriesServer } from "@/lib/bookings/server";
import { verifyStaffAccessToken } from "@/lib/staff/server";
import type { BookingSeriesCancelScope } from "@/lib/types";
import { NextResponse } from "next/server";

const SCOPES = new Set<BookingSeriesCancelScope>(["this", "future", "all"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const authResult = await verifyStaffAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { profile, db } = authResult.data;
  const { bookingId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const scope =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).scope === "string"
      ? ((body as Record<string, unknown>).scope as BookingSeriesCancelScope)
      : null;

  if (!scope || !SCOPES.has(scope)) {
    return NextResponse.json(
      { ok: false, error: "scope must be this, future, or all" },
      { status: 400 },
    );
  }

  const result = await cancelBookingSeriesServer(
    db,
    profile.facility_id,
    bookingId,
    scope,
    "staff",
  );

  if (result.error || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Failed to cancel bookings" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
