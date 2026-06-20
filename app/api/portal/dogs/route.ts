import { mapDogRowToDog, toDogInsert } from "@/lib/dogs";
import type { CreatePortalDogSuccessResponse } from "@/lib/portal/dogs";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import type { DogAlerts, DogSize } from "@/lib/types";
import { NextResponse } from "next/server";

interface CreatePortalDogBody {
  clientId?: string;
  facilityId?: string;
  name?: string;
  breed?: string;
  age?: string;
  size?: DogSize;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  medication?: string;
  feeding?: string;
  allergies?: string;
  behavior?: string;
  alerts?: DogAlerts;
  overnight?: boolean;
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

  let body: CreatePortalDogBody;
  try {
    body = (await request.json()) as CreatePortalDogBody;
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

  if (!body.name?.trim() || !body.breed?.trim() || !body.age?.trim() || !body.size) {
    return NextResponse.json(
      { ok: false, error: "Dog name, breed, age, and size are required" },
      { status: 400 },
    );
  }

  const defaultAlerts: DogAlerts = {
    medication: false,
    allergy: false,
    dietary: false,
    aggression: false,
    escapeRisk: false,
  };

  const dogInsert = toDogInsert(facilityId, {
    name: body.name,
    breed: body.breed,
    age: body.age,
    size: body.size,
    clientId,
    ownerName: body.ownerName?.trim() ?? "",
    ownerPhone: body.ownerPhone?.trim() ?? "",
    ownerEmail: body.ownerEmail?.trim() ?? "",
    medication: body.medication?.trim() ?? "",
    feeding: body.feeding?.trim() ?? "",
    allergies: body.allergies?.trim() ?? "",
    behavior: body.behavior?.trim() ?? "",
    alerts: body.alerts ?? defaultAlerts,
    overnight: body.overnight ?? false,
  });

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
