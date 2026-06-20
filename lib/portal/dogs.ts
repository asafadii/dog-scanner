import { mapDogRowToDog } from "@/lib/dogs";
import { portalFetch } from "@/lib/portal/api";
import {
  requireClientAccount,
  verifyLinkedClient,
} from "@/lib/portal/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DogRow } from "@/lib/supabase/types";
import type { Dog, DogAlerts, DogSize, NewDogFormData } from "@/lib/types";

export type PortalDogsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
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
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  medication: string;
  feeding: string;
  allergies: string;
  behavior: string;
  alerts: DogAlerts;
  overnight: boolean;
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
    ownerName: form.ownerName,
    ownerPhone: form.ownerPhone,
    ownerEmail: form.ownerEmail,
    medication: form.medication,
    feeding: form.feeding,
    allergies: form.allergies,
    behavior: form.behavior,
    alerts: form.alerts,
    overnight: form.overnight,
  };
}
