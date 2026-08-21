import { getFacilityAccessLevelServer } from "@/lib/billing/access";
import { mapDogRowToDog, toDogUpdate } from "@/lib/dogs";
import type { UpdatePortalDogSuccessResponse } from "@/lib/portal/dogs";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import { NextResponse } from "next/server";
import {
  missingRequiredDogFields,
  portalDogBodyToFormData,
  type PortalDogBody,
} from "../payload";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ dogId: string }> },
) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;
  const { dogId } = await context.params;

  if (!dogId) {
    return NextResponse.json(
      { ok: false, error: "dogId is required" },
      { status: 400 },
    );
  }

  let body: PortalDogBody;
  try {
    body = (await request.json()) as PortalDogBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const clientId = body.clientId?.trim();
  const facilityId = body.facilityId?.trim();
  if (!clientId || !facilityId) {
    return NextResponse.json(
      { ok: false, error: "clientId and facilityId are required" },
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

  const access = await getFacilityAccessLevelServer(db, facilityId);
  if (access.level === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        error: "This facility is not currently accepting profile updates.",
      },
      { status: 503 },
    );
  }

  const { data: existing, error: lookupError } = await db
    .from("dogs")
    .select("id")
    .eq("id", dogId)
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { ok: false, error: lookupError.message },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Dog not found" },
      { status: 404 },
    );
  }

  if (missingRequiredDogFields(body)) {
    return NextResponse.json(
      { ok: false, error: "Dog name, breed, age, and size are required" },
      { status: 400 },
    );
  }

  const form = portalDogBodyToFormData(body, clientId);
  const {
    clientId: _clientId,
    ownerName: _ownerName,
    ownerPhone: _ownerPhone,
    ownerEmail: _ownerEmail,
    ownerAddress: _ownerAddress,
    ownerEmergencyContact: _ownerEmergencyContact,
    ownerEmergencyPhone: _ownerEmergencyPhone,
    ownerNotes: _ownerNotes,
    ...dogFields
  } = form;

  const update = toDogUpdate(dogFields);
  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { ok: false, error: "No fields to update" },
      { status: 400 },
    );
  }

  const { data, error } = await db
    .from("dogs")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", dogId)
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .is("archived_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Dog not found" },
      { status: 404 },
    );
  }

  const response: UpdatePortalDogSuccessResponse = {
    ok: true,
    dog: mapDogRowToDog(data),
  };
  return NextResponse.json(response);
}
