import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import { getFacilityNotificationPreferences, getFacilityNotificationRecipients } from "@/lib/bookings/server";
import { buildBookingCancelledByClientHtml } from "@/lib/email";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import type { BookingStatus } from "@/lib/types";
import { NextResponse } from "next/server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

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

  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .select("id, facility_id, client_id, status, dog_id")
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
    status: BookingStatus;
    dog_id: string;
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

  if (bookingRow.status !== "pending" && bookingRow.status !== "approved") {
    return NextResponse.json(
      {
        ok: false,
        error: "Only pending or approved bookings can be cancelled",
      },
      { status: 400 },
    );
  }

  const { error: updateError } = await db
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_by: "client",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingRow.id)
    .eq("facility_id", bookingRow.facility_id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 },
    );
  }

  const [clientResult, dogResult, facilityResult] = await Promise.all([
    db
      .from("clients")
      .select("name")
      .eq("id", bookingRow.client_id)
      .eq("facility_id", bookingRow.facility_id)
      .maybeSingle(),
    db
      .from("dogs")
      .select("name")
      .eq("id", bookingRow.dog_id)
      .eq("facility_id", bookingRow.facility_id)
      .maybeSingle(),
    db
      .from("facilities")
      .select("name")
      .eq("id", bookingRow.facility_id)
      .maybeSingle(),
  ]);

  const clientName =
    (clientResult.data as { name?: string } | null)?.name ?? "A client";
  const dogName =
    (dogResult.data as { name?: string } | null)?.name ?? "your dog";
  const facilityName =
    (facilityResult.data as { name?: string } | null)?.name ?? "your daycare";

  const adminEmails = await getFacilityNotificationRecipients(
    db,
    bookingRow.facility_id,
  );
  const prefs = await getFacilityNotificationPreferences(
    db,
    bookingRow.facility_id,
  );

  if (adminEmails.length > 0 && prefs.notifyBookingCancelledByClient) {
    const bookingUrl = `${APP_URL}/bookings/${bookingRow.id}`;
    const html = buildBookingCancelledByClientHtml({
      dogName,
      clientName,
      facilityName,
      bookingUrl,
    });

    for (const email of adminEmails) {
      await sendTransactionalEmail({
        to: email,
        subject: `${dogName}'s booking was cancelled`,
        html,
      });
    }
  }

  return NextResponse.json({ ok: true, data: true });
}
