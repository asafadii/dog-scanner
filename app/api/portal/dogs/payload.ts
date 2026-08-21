import type { DogAlerts, DogGender, DogSize, FeedingSource, NewDogFormData } from "@/lib/types";

export interface PortalDogBody {
  clientId?: string;
  facilityId?: string;
  name?: string;
  breed?: string;
  age?: string;
  size?: DogSize;
  gender?: DogGender | null;
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
  vaccinationExpiryDate?: string;
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

const DEFAULT_ALERTS: DogAlerts = {
  medication: false,
  allergy: false,
  dietary: false,
  aggressionTowardsPeople: false,
  aggressionTowardsDogs: false,
  chewingRisk: false,
  escapeRisk: false,
};

export function asTriState(value: unknown): boolean | null {
  if (value === true || value === false || value === null) return value;
  return null;
}

export function asDogGender(value: unknown): DogGender | null {
  if (value === "male" || value === "female") return value;
  return null;
}

export function missingRequiredDogFields(body: PortalDogBody): boolean {
  return !body.name?.trim() || !body.breed?.trim() || !body.age?.trim() || !body.size;
}

export function portalDogBodyToFormData(
  body: PortalDogBody,
  clientId: string,
): NewDogFormData {
  const meals =
    body.feedingMealsPerDay === 1 ||
    body.feedingMealsPerDay === 2 ||
    body.feedingMealsPerDay === 3
      ? body.feedingMealsPerDay
      : 2;

  return {
    name: body.name ?? "",
    breed: body.breed ?? "",
    age: body.age ?? "",
    size: body.size ?? "medium",
    gender: asDogGender(body.gender),
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
    alerts: body.alerts ?? DEFAULT_ALERTS,
    microchipNumber: body.microchipNumber?.trim() ?? "",
    isNeutered: asTriState(body.isNeutered),
    healthCertificateNumber: body.healthCertificateNumber?.trim() ?? "",
    vaccinationExpiryDate: body.vaccinationExpiryDate?.trim() ?? "",
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
  };
}
