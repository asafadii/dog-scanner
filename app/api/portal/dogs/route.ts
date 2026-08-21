import { getFacilityAccessLevelServer } from "@/lib/billing/access";
import { mapDogRowToDog, toDogInsert } from "@/lib/dogs";
import type { CreatePortalDogSuccessResponse } from "@/lib/portal/dogs";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import { NextResponse } from "next/server";
import {
  missingRequiredDogFields,
  portalDogBodyToFormData,
  type PortalDogBody,
} from "./payload";

export async function POST(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;

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
        error:
          "This facility is not currently accepting new dog profiles.",
      },
      { status: 503 },
    );
  }

  if (missingRequiredDogFields(body)) {
    return NextResponse.json(
      { ok: false, error: "Dog name, breed, age, and size are required" },
      { status: 400 },
    );
  }

  const dogInsert = toDogInsert(
    facilityId,
    portalDogBodyToFormData(body, clientId),
  );

  const { data, error } = await db
    .from("dogs")
    .insert(dogInsert)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Failed to create dog" },
      { status: 500 },
    );
  }

  const response: CreatePortalDogSuccessResponse = {
    ok: true,
    dog: mapDogRowToDog(data),
  };
  return NextResponse.json(response, { status: 201 });
}
