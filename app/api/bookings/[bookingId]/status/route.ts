import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import {
  getBookingEmailContext,
  updateBookingStatusServer,
} from "@/lib/bookings/server";
import {
  buildBookingApprovedHtml,
  buildBookingRejectedHtml,
  formatEmailDate,
} from "@/lib/email";
import { verifyStaffAccessToken } from "@/lib/staff/server";
import type { BookingStatus } from "@/lib/types";
import { NextResponse } from "next/server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

const STATUS_VALUES = new Set<BookingStatus>([
  "approved",
  "rejected",
  "completed",
]);

export async function PATCH(
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

  const status =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).status === "string"
      ? ((body as Record<string, string>).status as BookingStatus)
      : null;

  if (!status || !STATUS_VALUES.has(status)) {
    return NextResponse.json(
      { ok: false, error: "status must be approved, rejected, or completed" },
      { status: 400 },
    );
  }

  const result = await updateBookingStatusServer(
    db,
    profile.facility_id,
    bookingId,
    status,
  );

  if (result.error || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Booking not found" },
      { status: 400 },
    );
  }

  const booking = result.data;

  if (status === "approved" || status === "rejected") {
    const emailContext = await getBookingEmailContext(
      db,
      profile.facility_id,
      booking,
    );

    if (emailContext) {
      const portalUrl = `${APP_URL}/portal/bookings/${booking.id}`;

      if (status === "approved") {
        await sendTransactionalEmail({
          to: emailContext.clientEmail,
          subject: `${emailContext.dogName}'s booking is confirmed! 🎉`,
          html: buildBookingApprovedHtml({
            clientName: emailContext.clientName,
            dogName: emailContext.dogName,
            facilityName: emailContext.facilityName,
            startDate: formatEmailDate(booking.startDate),
            endDate: formatEmailDate(booking.endDate),
            portalUrl,
          }),
        });
      } else {
        await sendTransactionalEmail({
          to: emailContext.clientEmail,
          subject: `Update on ${emailContext.dogName}'s booking`,
          html: buildBookingRejectedHtml({
            clientName: emailContext.clientName,
            dogName: emailContext.dogName,
            facilityName: emailContext.facilityName,
            portalUrl,
          }),
        });
      }
    }
  }

  return NextResponse.json({ ok: true, data: booking });
}
