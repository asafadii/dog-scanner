import { mapDogRowToDog } from "@/lib/dogs";
import { portalFetch } from "@/lib/portal/api";
import {
  requireClientAccount,
  verifyLinkedClient,
} from "@/lib/portal/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DogRow } from "@/lib/supabase/types";
import {
  getDogPhotoValidationMessage,
  validateDogPhotoFile,
} from "@/lib/storage";
import type {
  Dog,
  DogAlerts,
  DogGender,
  DogSize,
  FeedingSource,
  NewDogFormData,
} from "@/lib/types";

export type PortalDogsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "account_closed"
  | "not_found"
  | "unknown";

export interface PortalDogsError {
  message: string;
  code: PortalDogsErrorCode;
}

type PortalDogsResult<T> =
  | { data: T; error: null }
  | { data: null; error: PortalDogsError };

function toError(
  message: string,
  code: PortalDogsErrorCode = "unknown",
): PortalDogsError {
  return { message, code };
}

export interface PortalCreateDogInput {
  clientId: string;
  facilityId: string;
  name: string;
  breed: string;
  age: string;
  size: DogSize;
  gender: DogGender | null;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAddress: string;
  ownerEmergencyContact: string;
  ownerEmergencyPhone: string;
  ownerNotes: string;
  microchipNumber: string;
  isNeutered: boolean | null;
  healthCertificateNumber: string;
  vaccinationExpiryDate: string;
  aggressionTowardsPeople: boolean | null;
  aggressionTowardsDogs: boolean | null;
  separationAnxiety: boolean | null;
  kennelTrained: boolean | null;
  chewingRisk: boolean | null;
  separationAnxietyNotes: string;
  kennelTrainedNotes: string;
  chewingRiskNotes: string;
  aggressionPeopleNotes: string;
  aggressionDogsNotes: string;
  medicationNotes: string;
  allergyNotes: string;
  dietaryNotes: string;
  feedingSource: FeedingSource | null;
  feedingMealsPerDay: 1 | 2 | 3;
  feedingNotes: string;
  behavior: string;
  alerts: DogAlerts;
}

export interface CreatePortalDogSuccessResponse {
  ok: true;
  dog: Dog;
}

export interface CreatePortalDogErrorResponse {
  ok: false;
  error: string;
}

export type CreatePortalDogResponse =
  | CreatePortalDogSuccessResponse
  | CreatePortalDogErrorResponse;

export type UpdatePortalDogSuccessResponse = CreatePortalDogSuccessResponse;
export type UpdatePortalDogErrorResponse = CreatePortalDogErrorResponse;
export type UpdatePortalDogResponse = CreatePortalDogResponse;

export interface ArchivePortalDogSuccessResponse {
  ok: true;
  data: true;
}

export interface ArchivePortalDogErrorResponse {
  ok: false;
  error: string;
}

export type ArchivePortalDogResponse =
  | ArchivePortalDogSuccessResponse
  | ArchivePortalDogErrorResponse;

export interface UploadPortalDogPhotoSuccessResponse {
  ok: true;
  photoUrl: string;
}

export interface UploadPortalDogPhotoErrorResponse {
  ok: false;
  error: string;
}

export type UploadPortalDogPhotoResponse =
  | UploadPortalDogPhotoSuccessResponse
  | UploadPortalDogPhotoErrorResponse;

export async function getPortalDogs(
  clientId: string,
  facilityId: string,
): Promise<PortalDogsResult<Dog[]>> {
  const accountResult = await requireClientAccount();
  if (accountResult.error) {
    return { data: null, error: accountResult.error };
  }

  const linkResult = await verifyLinkedClient(clientId, facilityId);
  if (linkResult.error) {
    return { data: null, error: linkResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: (data as DogRow[]).map(mapDogRowToDog),
    error: null,
  };
}

export async function getPortalDogById(
  dogId: string,
  clientId: string,
  facilityId: string,
): Promise<PortalDogsResult<Dog>> {
  const accountResult = await requireClientAccount();
  if (accountResult.error) {
    return { data: null, error: accountResult.error };
  }

  const linkResult = await verifyLinkedClient(clientId, facilityId);
  if (linkResult.error) {
    return { data: null, error: linkResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("id", dogId)
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Dog not found", "not_found") };
  }

  return { data: mapDogRowToDog(data as DogRow), error: null };
}

export async function createPortalDog(
  input: PortalCreateDogInput,
): Promise<PortalDogsResult<Dog>> {
  const response = await portalFetch("/api/portal/dogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as CreatePortalDogResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to create dog profile";
    return {
      data: null,
      error: toError(message, response.status === 403 ? "unauthorized" : "unknown"),
    };
  }

  return { data: data.dog, error: null };
}

export async function updatePortalDog(
  dogId: string,
  input: PortalCreateDogInput,
): Promise<PortalDogsResult<Dog>> {
  const response = await portalFetch(`/api/portal/dogs/${dogId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as UpdatePortalDogResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to update dog profile";
    return {
      data: null,
      error: toError(
        message,
        response.status === 403 ? "unauthorized" : "unknown",
      ),
    };
  }

  return { data: data.dog, error: null };
}

export async function archivePortalDog(
  dogId: string,
  clientId: string,
  facilityId: string,
): Promise<PortalDogsResult<true>> {
  const response = await portalFetch(`/api/portal/dogs/${dogId}/archive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, facilityId }),
  });

  const data = (await response.json()) as ArchivePortalDogResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to delete dog profile";
    return {
      data: null,
      error: toError(
        message,
        response.status === 403
          ? "unauthorized"
          : response.status === 404
            ? "not_found"
            : "unknown",
      ),
    };
  }

  return { data: true, error: null };
}

export async function uploadPortalDogPhoto(
  dogId: string,
  file: File,
): Promise<PortalDogsResult<string>> {
  const validation = validateDogPhotoFile(file);
  if (!validation.ok) {
    return {
      data: null,
      error: toError(getDogPhotoValidationMessage(validation.code)),
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await portalFetch(`/api/portal/dogs/${dogId}/photo`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as UploadPortalDogPhotoResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to upload photo";
    return {
      data: null,
      error: toError(message, response.status === 403 ? "unauthorized" : "unknown"),
    };
  }

  return { data: data.photoUrl, error: null };
}

export function portalCreateDogInputFromForm(
  clientId: string,
  facilityId: string,
  form: NewDogFormData,
): PortalCreateDogInput {
  return {
    clientId,
    facilityId,
    name: form.name,
    breed: form.breed,
    age: form.age,
    size: form.size,
    gender: form.gender,
    ownerName: form.ownerName,
    ownerPhone: form.ownerPhone,
    ownerEmail: form.ownerEmail,
    ownerAddress: form.ownerAddress,
    ownerEmergencyContact: form.ownerEmergencyContact,
    ownerEmergencyPhone: form.ownerEmergencyPhone,
    ownerNotes: form.ownerNotes,
    microchipNumber: form.microchipNumber,
    isNeutered: form.isNeutered,
    healthCertificateNumber: form.healthCertificateNumber,
    vaccinationExpiryDate: form.vaccinationExpiryDate,
    aggressionTowardsPeople: form.aggressionTowardsPeople,
    aggressionTowardsDogs: form.aggressionTowardsDogs,
    separationAnxiety: form.separationAnxiety,
    kennelTrained: form.kennelTrained,
    chewingRisk: form.chewingRisk,
    separationAnxietyNotes: form.separationAnxietyNotes,
    kennelTrainedNotes: form.kennelTrainedNotes,
    chewingRiskNotes: form.chewingRiskNotes,
    aggressionPeopleNotes: form.aggressionPeopleNotes,
    aggressionDogsNotes: form.aggressionDogsNotes,
    medicationNotes: form.medicationNotes,
    allergyNotes: form.allergyNotes,
    dietaryNotes: form.dietaryNotes,
    feedingSource: form.feedingSource,
    feedingMealsPerDay: form.feedingMealsPerDay,
    feedingNotes: form.feedingNotes,
    behavior: form.behavior,
    alerts: form.alerts,
  };
}
