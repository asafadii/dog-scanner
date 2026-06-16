import {
  enrichDogWithCheckin,
  enrichDogsWithCheckins,
  getActiveCheckins,
  getDogActiveCheckin,
} from "@/lib/checkins";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ClientRow, DogInsert, DogRow, DogUpdate, ProfileRow } from "@/lib/supabase/types";
import type { Dog, DogClientLink, NewDogFormData } from "@/lib/types";

export const INCOMPLETE_SETUP_MESSAGE = "Your account setup is incomplete.";

export type DogsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "unknown";

export interface DogsError {
  message: string;
  code: DogsErrorCode;
}

export type UpdateDogInput = Partial<
  Omit<NewDogFormData, "alerts">
> & {
  alerts?: Partial<NewDogFormData["alerts"]>;
  photoUrl?: string | null;
  clientId?: string | null;
};

type DogsResult<T> =
  | { data: T; error: null }
  | { data: null; error: DogsError };

function toError(
  message: string,
  code: DogsErrorCode = "unknown",
): DogsError {
  return { message, code };
}

function mapClientRowToDogClientLink(row: ClientRow): DogClientLink {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    emergencyContact: row.emergency_contact,
    address: row.address,
    notes: row.notes,
  };
}

export function mapDogRowToDog(row: DogRow): Dog {
  const allergyText = row.allergies?.trim() ?? "";
  const dietNotes = row.diet_notes?.trim() ?? "";
  const medicationNotes = row.medication_notes?.trim() ?? "";
  const behaviorNotes = row.behavior_notes?.trim() ?? "";
  const vetContact = row.vet_contact?.trim() ?? "";
  const emergencyContact = row.emergency_contact?.trim() ?? "";

  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    age: row.age,
    size: row.size,
    photoUrl: row.photo_url,
    status: "checked_out",
    clientId: row.client_id,
    client: null,
    alerts: {
      medication: row.medication_required,
      allergy: allergyText.length > 0,
      dietary: dietNotes.length > 0,
      aggression: row.aggression_risk,
      escapeRisk: row.escape_risk,
    },
    owner: {
      name: row.owner_name,
      phone: row.owner_phone,
      email: "",
      emergencyContact: emergencyContact || row.owner_name,
      emergencyPhone: emergencyContact || row.owner_phone,
      veterinarian: vetContact,
      vetPhone: vetContact,
    },
    care: {
      medication: medicationNotes || "None",
      feeding: dietNotes || "Standard diet",
      allergies: allergyText || "None known",
      behavior: behaviorNotes || "No notes",
    },
    overnight: false,
    lastCheckIn: null,
    lastCheckOut: null,
    activeCheckinId: null,
    todaysCare: [],
    timeline: [],
  };
}

export function dogToFormData(dog: Dog): NewDogFormData {
  return {
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    size: dog.size,
    clientId: dog.clientId,
    ownerName: dog.owner.name,
    ownerPhone: dog.owner.phone,
    ownerEmail: dog.owner.email,
    medication: dog.care.medication === "None" ? "" : dog.care.medication,
    feeding:
      dog.care.feeding === "Standard diet" ? "" : dog.care.feeding,
    allergies:
      dog.care.allergies === "None known" ? "" : dog.care.allergies,
    behavior:
      dog.care.behavior === "No notes" ? "" : dog.care.behavior,
    alerts: { ...dog.alerts },
    overnight: dog.overnight,
  };
}

export function toDogInsert(
  facilityId: string,
  input: NewDogFormData,
  photoUrl?: string | null,
): DogInsert {
  const emergencyContact =
    input.ownerPhone.trim() || input.ownerName.trim();

  return {
    facility_id: facilityId,
    client_id: input.clientId,
    name: input.name.trim(),
    breed: input.breed.trim(),
    age: input.age.trim(),
    size: input.size,
    sex: null,
    photo_url: photoUrl ?? null,
    owner_name: input.ownerName.trim(),
    owner_phone: input.ownerPhone.trim(),
    emergency_contact: emergencyContact,
    vet_contact: "",
    behavior_notes: input.behavior.trim(),
    medication_required: input.alerts.medication,
    medication_notes: input.medication.trim(),
    diet_notes: input.feeding.trim(),
    allergies: input.allergies.trim(),
    aggression_risk: input.alerts.aggression,
    escape_risk: input.alerts.escapeRisk,
    is_active: true,
  };
}

export function toDogUpdate(input: UpdateDogInput): DogUpdate {
  const update: DogUpdate = {};

  if (input.name !== undefined) update.name = input.name.trim();
  if (input.breed !== undefined) update.breed = input.breed.trim();
  if (input.age !== undefined) update.age = input.age.trim();
  if (input.size !== undefined) update.size = input.size;
  if (input.clientId !== undefined) update.client_id = input.clientId;
  if (input.ownerName !== undefined) update.owner_name = input.ownerName.trim();
  if (input.ownerPhone !== undefined) {
    update.owner_phone = input.ownerPhone.trim();
    update.emergency_contact = input.ownerPhone.trim();
  }
  if (input.medication !== undefined) {
    update.medication_notes = input.medication.trim();
  }
  if (input.feeding !== undefined) update.diet_notes = input.feeding.trim();
  if (input.allergies !== undefined) update.allergies = input.allergies.trim();
  if (input.behavior !== undefined) {
    update.behavior_notes = input.behavior.trim();
  }

  if (input.alerts?.medication !== undefined) {
    update.medication_required = input.alerts.medication;
  }
  if (input.alerts?.aggression !== undefined) {
    update.aggression_risk = input.alerts.aggression;
  }
  if (input.alerts?.escapeRisk !== undefined) {
    update.escape_risk = input.alerts.escapeRisk;
  }
  if (input.photoUrl !== undefined) {
    update.photo_url = input.photoUrl;
  }

  return update;
}

async function resolveClientBackedFields(
  input: Pick<NewDogFormData, "clientId" | "ownerName" | "ownerPhone">,
  facilityId: string,
): Promise<{
  owner_name: string;
  owner_phone: string;
  emergency_contact: string;
} | null> {
  if (!input.clientId) return null;

  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("clients")
    .select("name, phone, emergency_contact")
    .eq("id", input.clientId)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (!data) return null;

  const row = data as Pick<ClientRow, "name" | "phone" | "emergency_contact">;
  const ownerName = row.name.trim() || input.ownerName.trim();
  const ownerPhone = row.phone?.trim() || input.ownerPhone.trim();
  const emergencyContact =
    row.emergency_contact?.trim() || ownerPhone || ownerName;

  return {
    owner_name: ownerName,
    owner_phone: ownerPhone,
    emergency_contact: emergencyContact,
  };
}

async function requireProfile(): Promise<DogsResult<ProfileRow>> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: toError("Not signed in", "unauthorized") };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      data: null,
      error: toError(profileError.message),
    };
  }

  if (!profile) {
    return {
      data: null,
      error: toError(INCOMPLETE_SETUP_MESSAGE, "incomplete_setup"),
    };
  }

  return { data: profile as ProfileRow, error: null };
}

async function attachClientToDog(
  dog: Dog,
  facilityId: string,
): Promise<Dog> {
  if (!dog.clientId) {
    return dog;
  }

  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", dog.clientId)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (!data) {
    return dog;
  }

  const client = mapClientRowToDogClientLink(data as ClientRow);
  return {
    ...dog,
    client,
    owner: {
      ...dog.owner,
      name: dog.owner.name || client.name,
      phone: dog.owner.phone || client.phone || "",
      email: dog.owner.email || client.email || "",
      emergencyContact:
        dog.owner.emergencyContact || client.emergencyContact || client.name,
      emergencyPhone:
        dog.owner.emergencyPhone || client.phone || dog.owner.phone,
    },
  };
}

export async function getCurrentUserProfile(): Promise<
  DogsResult<ProfileRow>
> {
  return requireProfile();
}

export async function getDogs(): Promise<DogsResult<Dog[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("facility_id", profileResult.data.facility_id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  const dogs = (data as DogRow[]).map(mapDogRowToDog);
  const checkinsResult = await getActiveCheckins();
  if (checkinsResult.error) {
    return { data: null, error: toError(checkinsResult.error.message) };
  }

  return {
    data: enrichDogsWithCheckins(dogs, checkinsResult.data),
    error: null,
  };
}

export async function getDogById(id: string): Promise<DogsResult<Dog>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("id", id)
    .eq("facility_id", profileResult.data.facility_id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Dog not found", "not_found") };
  }

  const dog = mapDogRowToDog(data as DogRow);
  const checkinResult = await getDogActiveCheckin(id);
  if (checkinResult.error) {
    return { data: null, error: toError(checkinResult.error.message) };
  }

  const enriched = enrichDogWithCheckin(dog, checkinResult.data);
  const withClient = await attachClientToDog(
    enriched,
    profileResult.data.facility_id,
  );

  return {
    data: withClient,
    error: null,
  };
}

export async function createDog(
  input: NewDogFormData,
  photoUrl?: string | null,
): Promise<DogsResult<Dog>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const insertRow = toDogInsert(
    profileResult.data.facility_id,
    input,
    photoUrl,
  );
  const clientFields = await resolveClientBackedFields(
    input,
    profileResult.data.facility_id,
  );
  if (clientFields) {
    insertRow.owner_name = clientFields.owner_name;
    insertRow.owner_phone = clientFields.owner_phone;
    insertRow.emergency_contact = clientFields.emergency_contact;
  }
  const { data, error } = await supabase
    .from("dogs")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: mapDogRowToDog(data as DogRow), error: null };
}

export async function updateDog(
  id: string,
  input: UpdateDogInput,
): Promise<DogsResult<Dog>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const update = toDogUpdate(input);
  if (input.clientId) {
    const clientFields = await resolveClientBackedFields(
      {
        clientId: input.clientId,
        ownerName: input.ownerName ?? "",
        ownerPhone: input.ownerPhone ?? "",
      },
      profileResult.data.facility_id,
    );
    if (clientFields) {
      update.owner_name = clientFields.owner_name;
      update.owner_phone = clientFields.owner_phone;
      update.emergency_contact = clientFields.emergency_contact;
    }
  }
  if (Object.keys(update).length === 0) {
    return getDogById(id);
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dogs")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("facility_id", profileResult.data.facility_id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Dog not found", "not_found") };
  }

  return { data: mapDogRowToDog(data as DogRow), error: null };
}
