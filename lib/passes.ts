import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import {
  formatLocalDateString,
  parseLocalDateString,
} from "@/lib/recurrence";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ClientPassInsert,
  ClientPassRow,
  PassTypeInsert,
  PassTypeRow,
  PassTypeUpdate,
  ProfileRow,
} from "@/lib/supabase/types";
import type {
  BookingServiceType,
  ClientPass,
  ClientPassDisplayStatus,
  ClientPassListItem,
  ClientPassStatus,
  PassType,
} from "@/lib/types";

export type PassesErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "validation"
  | "deactivated"
  | "unknown";

export interface PassesError {
  message: string;
  code: PassesErrorCode;
}

type PassesResult<T> =
  | { data: T; error: null }
  | { data: null; error: PassesError };

export interface CreatePassTypeInput {
  name: string;
  serviceType: BookingServiceType;
  price: number;
  occasions: number;
}

export type UpdatePassTypeInput = CreatePassTypeInput;

export interface AssignPassInput {
  passTypeId: string;
  expiryDate: string;
}

export const PASS_TYPE_DEACTIVATED_MESSAGE =
  "This pass type was deactivated. Please pick another.";

function toError(
  message: string,
  code: PassesErrorCode = "unknown",
): PassesError {
  return { message, code };
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapPassTypeRow(row: PassTypeRow): PassType {
  return {
    id: row.id,
    facilityId: row.facility_id,
    name: row.name,
    serviceType: row.service_type,
    price: toNumber(row.price),
    occasions: row.occasions,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePassTypeInput(
  input: CreatePassTypeInput,
): PassesError | null {
  const name = input.name.trim();
  if (!name) {
    return toError("Name is required.", "validation");
  }
  if (input.serviceType !== "daycare" && input.serviceType !== "boarding") {
    return toError("Type must be daycare or boarding.", "validation");
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    return toError("Price must be zero or greater.", "validation");
  }
  if (!Number.isInteger(input.occasions) || input.occasions < 1) {
    return toError("Occasions must be a whole number of at least 1.", "validation");
  }
  return null;
}

async function requireProfile(): Promise<PassesResult<ProfileRow>> {
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

export async function listPassTypes(): Promise<PassesResult<PassType[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pass_types")
    .select("*")
    .eq("facility_id", profileResult.data.facility_id)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: ((data ?? []) as PassTypeRow[]).map(mapPassTypeRow),
    error: null,
  };
}

export async function createPassType(
  input: CreatePassTypeInput,
): Promise<PassesResult<PassType>> {
  const validationError = validatePassTypeInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const insert: PassTypeInsert = {
    facility_id: profileResult.data.facility_id,
    name: input.name.trim(),
    service_type: input.serviceType,
    price: roundMoney(input.price),
    occasions: input.occasions,
    is_active: true,
  };

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pass_types")
    .insert(insert)
    .select("*")
    .single();

  if (error || !data) {
    return {
      data: null,
      error: toError(error?.message ?? "Failed to create pass type"),
    };
  }

  return { data: mapPassTypeRow(data as PassTypeRow), error: null };
}

export async function updatePassType(
  id: string,
  input: UpdatePassTypeInput,
): Promise<PassesResult<PassType>> {
  const validationError = validatePassTypeInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const update: PassTypeUpdate = {
    name: input.name.trim(),
    service_type: input.serviceType,
    price: roundMoney(input.price),
    occasions: input.occasions,
  };

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pass_types")
    .update(update)
    .eq("id", id)
    .eq("facility_id", profileResult.data.facility_id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Pass type not found", "not_found") };
  }

  return { data: mapPassTypeRow(data as PassTypeRow), error: null };
}

export async function deactivatePassType(
  id: string,
): Promise<PassesResult<PassType>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pass_types")
    .update({ is_active: false })
    .eq("id", id)
    .eq("facility_id", profileResult.data.facility_id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Pass type not found", "not_found") };
  }

  return { data: mapPassTypeRow(data as PassTypeRow), error: null };
}

export async function getPassTypeAssignmentCount(
  id: string,
): Promise<PassesResult<number>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { count, error } = await supabase
    .from("client_passes")
    .select("id", { count: "exact", head: true })
    .eq("facility_id", profileResult.data.facility_id)
    .eq("pass_type_id", id);

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: count ?? 0, error: null };
}

export async function getPassTypeAssignmentCounts(): Promise<
  PassesResult<Record<string, number>>
> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("client_passes")
    .select("pass_type_id")
    .eq("facility_id", profileResult.data.facility_id);

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { pass_type_id: string }[]) {
    counts[row.pass_type_id] = (counts[row.pass_type_id] ?? 0) + 1;
  }

  return { data: counts, error: null };
}

function mapClientPassRow(row: ClientPassRow): ClientPass {
  return {
    id: row.id,
    facilityId: row.facility_id,
    clientId: row.client_id,
    passTypeId: row.pass_type_id,
    serviceType: row.service_type,
    price: toNumber(row.price),
    occasionsTotal: row.occasions_total,
    occasionsUsed: row.occasions_used,
    expiryDate: row.expiry_date,
    status: row.status,
    assignedAt: row.assigned_at,
    assignedBy: row.assigned_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function resolveClientPassDisplayStatus(
  status: ClientPassStatus,
  expiryDate: string,
  now: Date = new Date(),
): ClientPassDisplayStatus {
  if (status === "exhausted" || status === "cancelled") {
    return status;
  }

  const expiry = parseLocalDateString(expiryDate);
  if (!expiry) {
    return status === "expired" ? "expired" : "active";
  }

  const today = parseLocalDateString(formatLocalDateString(now));
  if (!today) {
    return status === "expired" ? "expired" : "active";
  }

  const daysUntil = Math.round(
    (expiry.getTime() - today.getTime()) / 86_400_000,
  );
  if (daysUntil < 0) return "expired";
  if (daysUntil <= 7) return "expiring_soon";
  return "active";
}

async function requireClientInFacility(
  clientId: string,
  facilityId: string,
): Promise<PassesResult<true>> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("facility_id", facilityId)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Client not found", "not_found") };
  }

  return { data: true, error: null };
}

export async function assignPassToClient(
  clientId: string,
  input: AssignPassInput,
): Promise<PassesResult<ClientPassListItem>> {
  const passTypeId = input.passTypeId.trim();
  const expiryDate = input.expiryDate.trim();

  if (!passTypeId) {
    return {
      data: null,
      error: toError("Pass type is required.", "validation"),
    };
  }

  if (!expiryDate || !parseLocalDateString(expiryDate)) {
    return {
      data: null,
      error: toError("Expiry date is required.", "validation"),
    };
  }

  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const clientCheck = await requireClientInFacility(clientId, facilityId);
  if (clientCheck.error) {
    return { data: null, error: clientCheck.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data: passTypeRow, error: passTypeError } = await supabase
    .from("pass_types")
    .select("*")
    .eq("id", passTypeId)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (passTypeError) {
    return { data: null, error: toError(passTypeError.message) };
  }

  if (!passTypeRow) {
    return { data: null, error: toError("Pass type not found", "not_found") };
  }

  const passType = passTypeRow as PassTypeRow;
  if (!passType.is_active) {
    return {
      data: null,
      error: toError(PASS_TYPE_DEACTIVATED_MESSAGE, "deactivated"),
    };
  }

  const insert: ClientPassInsert = {
    facility_id: facilityId,
    client_id: clientId,
    pass_type_id: passType.id,
    service_type: passType.service_type,
    price: toNumber(passType.price),
    occasions_total: passType.occasions,
    occasions_used: 0,
    expiry_date: expiryDate,
    status: "active",
    assigned_by: profileResult.data.id,
  };

  const { data, error } = await supabase
    .from("client_passes")
    .insert(insert)
    .select("*")
    .single();

  if (error || !data) {
    return {
      data: null,
      error: toError(error?.message ?? "Failed to assign pass"),
    };
  }

  const mapped = mapClientPassRow(data as ClientPassRow);
  return {
    data: {
      ...mapped,
      displayStatus: resolveClientPassDisplayStatus(
        mapped.status,
        mapped.expiryDate,
      ),
      passTypeName: passType.name,
    },
    error: null,
  };
}

export async function listClientPasses(
  clientId: string,
): Promise<PassesResult<ClientPassListItem[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const clientCheck = await requireClientInFacility(clientId, facilityId);
  if (clientCheck.error) {
    return { data: null, error: clientCheck.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("client_passes")
    .select("*")
    .eq("client_id", clientId)
    .eq("facility_id", facilityId)
    .order("assigned_at", { ascending: false });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  const rows = (data ?? []) as ClientPassRow[];
  return toClientPassListItems(supabase, facilityId, rows);
}

async function toClientPassListItems(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  facilityId: string,
  rows: ClientPassRow[],
): Promise<PassesResult<ClientPassListItem[]>> {
  const typeIds = [...new Set(rows.map((row) => row.pass_type_id))];
  const namesById: Record<string, string> = {};

  if (typeIds.length > 0) {
    const { data: typeRows, error: typeError } = await supabase
      .from("pass_types")
      .select("id, name")
      .eq("facility_id", facilityId)
      .in("id", typeIds);

    if (typeError) {
      return { data: null, error: toError(typeError.message) };
    }

    for (const typeRow of (typeRows ?? []) as { id: string; name: string }[]) {
      namesById[typeRow.id] = typeRow.name;
    }
  }

  return {
    data: rows.map((row) => {
      const mapped = mapClientPassRow(row);
      return {
        ...mapped,
        displayStatus: resolveClientPassDisplayStatus(
          mapped.status,
          mapped.expiryDate,
        ),
        passTypeName: namesById[mapped.passTypeId] ?? "Unknown pass",
      };
    }),
    error: null,
  };
}

export async function getApplicablePasses(
  clientId: string,
  serviceType: BookingServiceType,
): Promise<PassesResult<ClientPassListItem[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const clientCheck = await requireClientInFacility(clientId, facilityId);
  if (clientCheck.error) {
    return { data: null, error: clientCheck.error };
  }

  const today = formatLocalDateString(new Date());
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("client_passes")
    .select("*")
    .eq("client_id", clientId)
    .eq("facility_id", facilityId)
    .eq("status", "active")
    .eq("service_type", serviceType)
    .gte("expiry_date", today)
    .order("expiry_date", { ascending: true });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  const rows = ((data ?? []) as ClientPassRow[]).filter(
    (row) => row.occasions_used < row.occasions_total,
  );

  return toClientPassListItems(supabase, facilityId, rows);
}
