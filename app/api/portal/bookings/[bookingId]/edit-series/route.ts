import {
  editBookingSeriesServer,
  parseEditBookingSeriesFields,
} from "@/lib/bookings/server";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import type { BookingSeriesCancelScope } from "@/lib/types";
import { NextResponse } from "next/server";

const SCOPES = new Set<BookingSeriesCancelScope>(["this", "future", "all"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;
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

  const fields = parseEditBookingSeriesFields(body);
  if (!fields) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Provide at least one of arrivalTime, endTime, transportRequired, or notes",
      },
      { status: 400 },
    );
  }

  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .select("id, facility_id, client_id, status")
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
      { ok: false, error: "Booking not found" },
      { status: 404 },
    );
  }

  const bookingRow = booking as {
    id: string;
    facility_id: string;
    client_id: string;
    status: string;
  };

  const linked = await verifyClientAccountLink(
    db,
    user.id,
    bookingRow.client_id,
    bookingRow.facility_id,
  );

  if (!linked) {
    return NextResponse.json(
      { ok: false, error: "Not authorized" },
      { status: 403 },
    );
  }

  const result = await editBookingSeriesServer(
    db,
    bookingRow.facility_id,
    bookingRow.id,
    scope,
    fields,
    "client",
  );

  if (result.error || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Failed to update bookings" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
