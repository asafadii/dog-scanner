import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  KennelAssignmentRow,
  KennelAssignmentWithKennelRow,
  KennelRow,
  ProfileRow,
} from "@/lib/supabase/types";
import type {
  Kennel,
  KennelAssignment,
  LocationType,
} from "@/lib/types";

export type KennelsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "validation"
  | "unknown";

export interface KennelsError {
  message: string;
  code: KennelsErrorCode;
}

type KennelsResult<T> =
  | { data: T; error: null }
  | { data: null; error: KennelsError };

export interface AssignLocationInput {
  locationType: LocationType;
  kennelId?: string | null;
  notes?: string | null;
}

export interface UpdateKennelInput {
  name?: string;
  capacity?: number;
  isActive?: boolean;
}

const LOCATION_LABELS: Record<Exclude<LocationType, "kennel">, string> = {
  daycare: "Daycare",
  grooming: "Grooming",
  isolation: "Isolation",
};

function toError(
  message: string,
  code: KennelsErrorCode = "unknown",
): KennelsError {
  return { message, code };
}

function mapKennelRow(row: KennelRow): Kennel {
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    isActive: row.is_active,
  };
}

function mapAssignmentRow(
  row: KennelAssignmentRow,
  kennelName: string | null = null,
): KennelAssignment {
  return {
    id: row.id,
    checkinId: row.checkin_id,
    locationType: row.location_type,
    kennelId: row.kennel_id,
    kennelName,
    notes: row.notes,
    assignedAt: row.assigned_at,
  };
}

function mapAssignmentWithKennelRow(row: KennelAssignmentWithKennelRow): KennelAssignment {
  return mapAssignmentRow(row, row.kennels?.name ?? null);
}

export function formatLocationLabel(assignment: KennelAssignment | null): string | null {
  if (!assignment) {
    return null;
  }

  if (assignment.locationType === "kennel") {
    return assignment.kennelName ?? "Kennel";
  }

  return LOCATION_LABELS[assignment.locationType];
}

async function requireProfile(): Promise<KennelsResult<ProfileRow>> {
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

export async function getKennels(): Promise<KennelsResult<Kennel[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("kennels")
    .select("*")
    .eq("facility_id", profileResult.data.facility_id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: (data as KennelRow[]).map(mapKennelRow),
    error: null,
  };
}

export async function getAllKennels(): Promise<KennelsResult<Kennel[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("kennels")
    .select("*")
    .eq("facility_id", profileResult.data.facility_id)
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: (data as KennelRow[]).map(mapKennelRow),
    error: null,
  };
}

export async function createKennel(
  name: string,
  capacity: number,
): Promise<KennelsResult<Kennel>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const trimmedName = name.trim();
  const normalizedCapacity = Math.floor(capacity);

  if (!trimmedName) {
    return {
      data: null,
      error: toError("Kennel name is required.", "validation"),
    };
  }

  if (normalizedCapacity < 1) {
    return {
      data: null,
      error: toError("Capacity must be at least 1.", "validation"),
    };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("kennels")
    .insert({
      facility_id: profileResult.data.facility_id,
      name: trimmedName,
      capacity: normalizedCapacity,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: mapKennelRow(data as KennelRow), error: null };
}

export async function updateKennel(
  id: string,
  input: UpdateKennelInput,
): Promise<KennelsResult<Kennel>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const update: {
    name?: string;
    capacity?: number;
    is_active?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      return {
        data: null,
        error: toError("Kennel name is required.", "validation"),
      };
    }
    update.name = trimmedName;
  }

  if (input.capacity !== undefined) {
    const normalizedCapacity = Math.floor(input.capacity);
    if (normalizedCapacity < 1) {
      return {
        data: null,
        error: toError("Capacity must be at least 1.", "validation"),
      };
    }
    update.capacity = normalizedCapacity;
  }

  if (input.isActive !== undefined) {
    update.is_active = input.isActive;
  }

  if (Object.keys(update).length === 1) {
    return { data: null, error: toError("No changes to save.", "validation") };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("kennels")
    .update(update)
    .eq("id", id)
    .eq("facility_id", profileResult.data.facility_id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: toError("Kennel not found", "not_found") };
  }

  return { data: mapKennelRow(data as KennelRow), error: null };
}

export async function getCurrentAssignment(
  checkinId: string,
): Promise<KennelsResult<KennelAssignment | null>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("kennel_assignments")
    .select("*, kennels(name)")
    .eq("checkin_id", checkinId)
    .eq("facility_id", profileResult.data.facility_id)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    return { data: null, error: null };
  }

  return {
    data: mapAssignmentWithKennelRow(data as KennelAssignmentWithKennelRow),
    error: null,
  };
}

export async function getActiveAssignmentsMap(
  checkinIds: string[],
): Promise<KennelsResult<Map<string, KennelAssignment>>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  if (checkinIds.length === 0) {
    return { data: new Map(), error: null };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("kennel_assignments")
    .select("*, kennels(name)")
    .eq("facility_id", profileResult.data.facility_id)
    .in("checkin_id", checkinIds)
    .order("assigned_at", { ascending: false });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  const map = new Map<string, KennelAssignment>();
  for (const row of data as KennelAssignmentWithKennelRow[]) {
    if (!map.has(row.checkin_id)) {
      map.set(row.checkin_id, mapAssignmentWithKennelRow(row));
    }
  }

  return { data: map, error: null };
}

export async function assignLocation(
  checkinId: string,
  input: AssignLocationInput,
): Promise<KennelsResult<KennelAssignment>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  if (input.locationType === "kennel" && !input.kennelId) {
    return {
      data: null,
      error: toError("Select a kennel for kennel placement.", "validation"),
    };
  }

  if (input.locationType !== "kennel" && input.kennelId) {
    return {
      data: null,
      error: toError("Kennel selection is only valid for kennel placement.", "validation"),
    };
  }

  const supabase = createSupabaseBrowserClient();
  const { data: checkin, error: checkinError } = await supabase
    .from("dog_checkins")
    .select("id")
    .eq("id", checkinId)
    .eq("facility_id", profileResult.data.facility_id)
    .is("checked_out_at", null)
    .maybeSingle();

  if (checkinError) {
    return { data: null, error: toError(checkinError.message) };
  }

  if (!checkin) {
    return {
      data: null,
      error: toError("Active check-in not found", "not_found"),
    };
  }

  let kennelName: string | null = null;
  if (input.locationType === "kennel" && input.kennelId) {
    const { data: kennel, error: kennelError } = await supabase
      .from("kennels")
      .select("id, name, is_active")
      .eq("id", input.kennelId)
      .eq("facility_id", profileResult.data.facility_id)
      .maybeSingle();

    if (kennelError) {
      return { data: null, error: toError(kennelError.message) };
    }

    if (!kennel || !kennel.is_active) {
      return {
        data: null,
        error: toError("Selected kennel was not found.", "not_found"),
      };
    }

    kennelName = kennel.name;
  }

  const { data, error } = await supabase
    .from("kennel_assignments")
    .insert({
      checkin_id: checkinId,
      facility_id: profileResult.data.facility_id,
      location_type: input.locationType,
      kennel_id: input.locationType === "kennel" ? input.kennelId ?? null : null,
      assigned_by: profileResult.data.id,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: mapAssignmentRow(data as KennelAssignmentRow, kennelName),
    error: null,
  };
}

export { INCOMPLETE_SETUP_MESSAGE };
