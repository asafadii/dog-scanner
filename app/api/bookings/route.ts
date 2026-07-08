import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import {
  createBookingServer,
  getBookingEmailContext,
  parseBookingFormData,
} from "@/lib/bookings/server";
import {
  buildBookingConfirmationHtml,
  formatEmailDate,
} from "@/lib/email";
import { verifyStaffAccessToken } from "@/lib/staff/server";
import { NextResponse } from "next/server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

export async function POST(request: Request) {
  const authResult = await verifyStaffAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { profile, db } = authResult.data;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const formData = parseBookingFormData(body);
  if (!formData) {
    return NextResponse.json(
      { ok: false, error: "Invalid booking data" },
      { status: 400 },
    );
  }

  if (formData.endDate < formData.startDate) {
    return NextResponse.json(
      { ok: false, error: "End date must be on or after start date" },
      { status: 400 },
    );
  }

  const result = await createBookingServer(
    db,
    profile.facility_id,
    formData,
  );

  if (result.error || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Failed to create booking" },
      { status: 400 },
    );
  }

  const booking = result.data;

  const emailContext = await getBookingEmailContext(
    db,
    profile.facility_id,
    booking,
  );

  if (emailContext) {
    const portalUrl = `${APP_URL}/portal/bookings/${booking.id}`;
    const startDate = formatEmailDate(booking.startDate);
    const endDate = formatEmailDate(booking.endDate);

    await sendTransactionalEmail({
      to: emailContext.clientEmail,
      subject: `Booking received for ${emailContext.dogName} 🐾`,
      html: buildBookingConfirmationHtml({
        clientName: emailContext.clientName,
        dogName: emailContext.dogName,
        facilityName: emailContext.facilityName,
        serviceType: booking.serviceType,
        startDate,
        endDate,
        portalUrl,
      }),
    });
  }

  return NextResponse.json({ ok: true, data: booking });
}
