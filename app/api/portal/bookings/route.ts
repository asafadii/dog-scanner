import { mapBookingRowToBooking } from "@/lib/bookings";
import type { CreatePortalBookingSuccessResponse } from "@/lib/portal/bookings";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import type { BookingFormData, BookingServiceType } from "@/lib/types";
import { NextResponse } from "next/server";

interface CreatePortalBookingBody extends BookingFormData {
  facilityId?: string;
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

  let body: CreatePortalBookingBody;
  try {
    body = (await request.json()) as CreatePortalBookingBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const clientId = body.clientId?.trim();
  const facilityId = body.facilityId?.trim();
  const dogId = body.dogId?.trim();
  const serviceType = body.serviceType as BookingServiceType | undefined;
  const startDate = body.startDate?.trim();
  const endDate = body.endDate?.trim();

  if (!clientId || !facilityId || !dogId || !serviceType || !startDate || !endDate) {
    return NextResponse.json(
      { ok: false, error: "Missing required booking fields" },
      { status: 400 },
    );
  }

  if (endDate < startDate) {
    return NextResponse.json(
      { ok: false, error: "End date must be on or after start date" },
      { status: 400 },
    );
  }

  const linked = await verifyClientAccountLink(db, user.id, clientId, facilityId);
  if (!linked) {
    return NextResponse.json(
      { ok: false, error: "Not authorized" },
      { status: 403 },
    );
  }

  const { data: dog, error: dogError } = await db
    .from("dogs")
    .select("id, client_id, facility_id")
    .eq("id", dogId)
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .maybeSingle();

  if (dogError) {
    return NextResponse.json(
      { ok: false, error: dogError.message },
      { status: 500 },
    );
  }

  if (!dog) {
    return NextResponse.json(
      { ok: false, error: "Dog not found for this client" },
      { status: 403 },
    );
  }

  const { data, error } = await db
    .from("bookings")
    .insert({
      facility_id: facilityId,
      client_id: clientId,
      dog_id: dogId,
      service_type: serviceType,
      start_date: startDate,
      end_date: endDate,
      transport_required: Boolean(body.transportRequired),
      status: "pending",
      notes: body.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Failed to create booking" },
      { status: 500 },
    );
  }

  const { data: clientRow } = await db
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .maybeSingle();

  const { data: dogRow } = await db
    .from("dogs")
    .select("name, breed")
    .eq("id", dogId)
    .maybeSingle();

  const response: CreatePortalBookingSuccessResponse = {
    ok: true,
    booking: mapBookingRowToBooking(
      data,
      clientRow?.name ?? "Unknown client",
      dogRow?.name ?? "Unknown dog",
      dogRow?.breed ?? "",
    ),
  };
  return NextResponse.json(response, { status: 201 });
}
