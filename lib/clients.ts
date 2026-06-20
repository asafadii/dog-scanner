import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ClientInsert,
  ClientRow,
  ClientUpdate,
  DogRow,
  ProfileRow,
} from "@/lib/supabase/types";
import type { Client, ClientFormData, Dog } from "@/lib/types";
import { INCOMPLETE_SETUP_MESSAGE, mapDogRowToDog } from "@/lib/dogs";

export type ClientsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "unknown";

export interface ClientsError {
  message: string;
  code: ClientsErrorCode;
}

type ClientsResult<T> =
  | { data: T; error: null }
  | { data: null; error: ClientsError };

function toError(
  message: string,
  code: ClientsErrorCode = "unknown",
): ClientsError {
  return { message, code };
}

export function mapClientRowToClient(
  row: ClientRow,
  dogCount?: number,
): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    emergencyContact: row.emergency_contact,
    notes: row.notes,
    inviteCode: row.invite_code,
    dogCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function clientToFormData(client: Client): ClientFormData {
  return {
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    address: client.address ?? "",
    emergencyContact: client.emergencyContact ?? "",
    notes: client.notes ?? "",
  };
}

function toClientInsert(
  facilityId: string,
  input: ClientFormData,
): ClientInsert {
  return {
    facility_id: facilityId,
    name: input.name.trim(),
    email: input.email.trim() || null,
    phone: input.phone.trim() || null,
    address: input.address.trim() || null,
    emergency_contact: input.emergencyContact.trim() || null,
    notes: input.notes.trim() || null,
  };
}

function toClientUpdate(input: Partial<ClientFormData>): ClientUpdate {
  const update: ClientUpdate = {};

  if (input.name !== undefined) update.name = input.name.trim();
  if (input.email !== undefined) update.email = input.email.trim() || null;
  if (input.phone !== undefined) update.phone = input.phone.trim() || null;
  if (input.address !== undefined) update.address = input.address.trim() || null;
  if (input.emergencyContact !== undefined) {
    update.emergency_contact = input.emergencyContact.trim() || null;
  }
  if (input.notes !== undefined) update.notes = input.notes.trim() || null;

  return update;
}

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 8;

function generateInviteCodeValue(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += INVITE_CODE_CHARS[
      Math.floor(Math.random() * INVITE_CODE_CHARS.length)
    ];
  }
  return code;
}

export async function generateClientInviteCode(
  id: string,
): Promise<ClientsResult<string>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const facilityId = profileResult.data.facility_id;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCodeValue();
    const { data, error } = await supabase
      .from("clients")
      .update({ invite_code: inviteCode, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("facility_id", facilityId)
      .select("invite_code")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") continue;
      return { data: null, error: toError(error.message) };
    }

    if (!data?.invite_code) {
      return { data: null, error: toError("Client not found", "not_found") };
    }

    return { data: data.invite_code, error: null };
  }

  return {
    data: null,
    error: toError("Could not generate a unique invite code"),
  };
}

async function requireProfile(): Promise<ClientsResult<ProfileRow>> {
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
    return { data: null, error: toError(profileError.message) };
  }

  if (!profile) {
    return {
      data: null,
      error: toError(INCOMPLETE_SETUP_MESSAGE, "incomplete_setup"),
    };
  }

  return { data: profile as ProfileRow, error: null };
}

async function getDogCountsByClientId(
  facilityId: string,
): Promise<Map<string, number>> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dogs")
    .select("client_id")
    .eq("facility_id", facilityId)
    .eq("is_active", true)
    .not("client_id", "is", null);

  const counts = new Map<string, number>();
  if (error || !data) {
    return counts;
  }

  for (const row of data as Pick<DogRow, "client_id">[]) {
    if (!row.client_id) continue;
    counts.set(row.client_id, (counts.get(row.client_id) ?? 0) + 1);
  }

  return counts;
}

export async function getClients(): Promise<ClientsResult<Client[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const supabase = createSupabaseBrowserClient();
  const [clientsResult, dogCounts] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("facility_id", facilityId)
      .order("name", { ascending: true }),
    getDogCountsByClientId(facilityId),
  ]);

  if (clientsResult.error) {
    return { data: null, error: toError(clientsResult.error.message) };
  }

  return {
    data: (clientsResult.data as ClientRow[]).map((row) =>
      mapClientRowToClient(row, dogCounts.get(row.id) ?? 0),
    ),
    error: null,
  };
}

export async function getClientById(
  id: string,
): Promise<ClientsResult<Client>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Client not found", "not_found") };
  }

  const dogCounts = await getDogCountsByClientId(facilityId);

  return {
    data: mapClientRowToClient(data as ClientRow, dogCounts.get(id) ?? 0),
    error: null,
  };
}

export async function createClient(
  input: ClientFormData,
): Promise<ClientsResult<Client>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("clients")
    .insert(toClientInsert(profileResult.data.facility_id, input))
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: mapClientRowToClient(data as ClientRow, 0), error: null };
}

export async function updateClient(
  id: string,
  input: Partial<ClientFormData>,
): Promise<ClientsResult<Client>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const update = toClientUpdate(input);
  if (Object.keys(update).length === 0) {
    return getClientById(id);
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("clients")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("facility_id", profileResult.data.facility_id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Client not found", "not_found") };
  }

  const dogCounts = await getDogCountsByClientId(profileResult.data.facility_id);

  return {
    data: mapClientRowToClient(data as ClientRow, dogCounts.get(id) ?? 0),
    error: null,
  };
}

export async function getClientDogs(
  clientId: string,
): Promise<ClientsResult<Dog[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("facility_id", profileResult.data.facility_id)
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

export { INCOMPLETE_SETUP_MESSAGE };
