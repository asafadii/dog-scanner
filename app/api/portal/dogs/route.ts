import { mapDogRowToDog, toDogInsert } from "@/lib/dogs";
import type { CreatePortalDogSuccessResponse } from "@/lib/portal/dogs";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import type { DogAlerts, DogSize, FeedingSource } from "@/lib/types";
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
  ownerAddress?: string;
  ownerEmergencyContact?: string;
  ownerEmergencyPhone?: string;
  ownerNotes?: string;
  microchipNumber?: string;
  isNeutered?: boolean | null;
  healthCertificateNumber?: string;
  aggressionTowardsPeople?: boolean | null;
  aggressionTowardsDogs?: boolean | null;
  separationAnxiety?: boolean | null;
  kennelTrained?: boolean | null;
  chewingRisk?: boolean | null;
  separationAnxietyNotes?: string;
  kennelTrainedNotes?: string;
  chewingRiskNotes?: string;
  aggressionPeopleNotes?: string;
  aggressionDogsNotes?: string;
  medicationNotes?: string;
  allergyNotes?: string;
  dietaryNotes?: string;
  feedingSource?: FeedingSource | null;
  feedingMealsPerDay?: 1 | 2 | 3;
  feedingNotes?: string;
  behavior?: string;
  alerts?: DogAlerts;
  /** @deprecated legacy portal payload keys */
  medication?: string;
  feeding?: string;
  allergies?: string;
}

function asTriState(value: unknown): boolean | null {
  if (value === true || value === false || value === null) return value;
  return null;
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
    aggressionTowardsPeople: false,
    aggressionTowardsDogs: false,
    chewingRisk: false,
    escapeRisk: false,
  };

  const meals =
    body.feedingMealsPerDay === 1 ||
    body.feedingMealsPerDay === 2 ||
    body.feedingMealsPerDay === 3
      ? body.feedingMealsPerDay
      : 2;

  const dogInsert = toDogInsert(facilityId, {
    name: body.name,
    breed: body.breed,
    age: body.age,
    size: body.size,
    clientId,
    ownerName: body.ownerName?.trim() ?? "",
    ownerPhone: body.ownerPhone?.trim() ?? "",
    ownerEmail: body.ownerEmail?.trim() ?? "",
    ownerAddress: body.ownerAddress?.trim() ?? "",
    ownerEmergencyContact: body.ownerEmergencyContact?.trim() ?? "",
    ownerEmergencyPhone: body.ownerEmergencyPhone?.trim() ?? "",
    ownerNotes: body.ownerNotes?.trim() ?? "",
    medicationNotes:
      body.medicationNotes?.trim() ?? body.medication?.trim() ?? "",
    allergyNotes: body.allergyNotes?.trim() ?? body.allergies?.trim() ?? "",
    dietaryNotes: body.dietaryNotes?.trim() ?? "",
    feedingSource: body.feedingSource ?? null,
    feedingMealsPerDay: meals,
    feedingNotes: body.feedingNotes?.trim() ?? body.feeding?.trim() ?? "",
    behavior: body.behavior?.trim() ?? "",
    alerts: body.alerts ?? defaultAlerts,
    microchipNumber: body.microchipNumber?.trim() ?? "",
    isNeutered: asTriState(body.isNeutered),
    healthCertificateNumber: body.healthCertificateNumber?.trim() ?? "",
    aggressionTowardsPeople: asTriState(body.aggressionTowardsPeople),
    aggressionTowardsDogs: asTriState(body.aggressionTowardsDogs),
    separationAnxiety: asTriState(body.separationAnxiety),
    kennelTrained: asTriState(body.kennelTrained),
    chewingRisk: asTriState(body.chewingRisk),
    separationAnxietyNotes: body.separationAnxietyNotes?.trim() ?? "",
    kennelTrainedNotes: body.kennelTrainedNotes?.trim() ?? "",
    chewingRiskNotes: body.chewingRiskNotes?.trim() ?? "",
    aggressionPeopleNotes: body.aggressionPeopleNotes?.trim() ?? "",
    aggressionDogsNotes: body.aggressionDogsNotes?.trim() ?? "",
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
