import { getCurrentUserProfile } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DogCheckinRow } from "@/lib/supabase/types";
import type { Dog } from "@/lib/types";

export type CheckinsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "already_checked_in"
  | "not_checked_in"
  | "unknown";

export interface CheckinsError {
  message: string;
  code: CheckinsErrorCode;
}

type CheckinsResult<T> =
  | { data: T; error: null }
  | { data: null; error: CheckinsError };

function toError(
  message: string,
  code: CheckinsErrorCode = "unknown",
): CheckinsError {
  return { message, code };
}

export function enrichDogWithCheckin(
  dog: Dog,
  activeCheckin: DogCheckinRow | null,
): Dog {
  if (!activeCheckin) {
    return {
      ...dog,
      status: "checked_out",
      activeCheckinId: null,
    };
  }

  return {
    ...dog,
    status: "checked_in",
    lastCheckIn: activeCheckin.checked_in_at,
    activeCheckinId: activeCheckin.id,
  };
}

export function enrichDogAfterCheckout(
  dog: Dog,
  checkin: DogCheckinRow,
): Dog {
  return {
    ...dog,
    status: "checked_out",
    activeCheckinId: null,
    lastCheckOut: checkin.checked_out_at,
  };
}

export function enrichDogsWithCheckins(
  dogs: Dog[],
  activeCheckins: DogCheckinRow[],
): Dog[] {
  const activeByDogId = new Map(
    activeCheckins.map((checkin) => [checkin.dog_id, checkin]),
  );

  return dogs.map((dog) =>
    enrichDogWithCheckin(dog, activeByDogId.get(dog.id) ?? null),
  );
}

async function requireFacilityContext(): Promise<
  CheckinsResult<{ facilityId: string; userId: string }>
> {
  const profileResult = await getCurrentUserProfile();
  if (profileResult.error) {
    return {
      data: null,
      error: {
        message: profileResult.error.message,
        code: profileResult.error.code,
      },
    };
  }

  return {
    data: {
      facilityId: profileResult.data.facility_id,
      userId: profileResult.data.id,
    },
    error: null,
  };
}

export async function getActiveCheckins(): Promise<
  CheckinsResult<DogCheckinRow[]>
> {
  const contextResult = await requireFacilityContext();
  if (contextResult.error) {
    return { data: null, error: contextResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dog_checkins")
    .select("*")
    .eq("facility_id", contextResult.data.facilityId)
    .is("checked_out_at", null)
    .order("checked_in_at", { ascending: false });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: data as DogCheckinRow[], error: null };
}

export async function getDogActiveCheckin(
  dogId: string,
): Promise<CheckinsResult<DogCheckinRow | null>> {
  const contextResult = await requireFacilityContext();
  if (contextResult.error) {
    return { data: null, error: contextResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dog_checkins")
    .select("*")
    .eq("facility_id", contextResult.data.facilityId)
    .eq("dog_id", dogId)
    .is("checked_out_at", null)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: (data as DogCheckinRow | null) ?? null, error: null };
}

export async function isDogCheckedIn(dogId: string): Promise<boolean> {
  const result = await getDogActiveCheckin(dogId);
  return result.data !== null;
}

export async function checkInDog(
  dogId: string,
): Promise<CheckinsResult<DogCheckinRow>> {
  const contextResult = await requireFacilityContext();
  if (contextResult.error) {
    return { data: null, error: contextResult.error };
  }

  const supabase = createSupabaseBrowserClient();

  const { data: dog, error: dogError } = await supabase
    .from("dogs")
    .select("id")
    .eq("id", dogId)
    .eq("facility_id", contextResult.data.facilityId)
    .eq("is_active", true)
    .maybeSingle();

  if (dogError) {
    return { data: null, error: toError(dogError.message) };
  }

  if (!dog) {
    return { data: null, error: toError("Dog not found", "not_found") };
  }

  const existingResult = await getDogActiveCheckin(dogId);
  if (existingResult.error) {
    return { data: null, error: existingResult.error };
  }

  if (existingResult.data) {
    return {
      data: null,
      error: toError("Dog is already checked in", "already_checked_in"),
    };
  }

  const { data, error } = await supabase
    .from("dog_checkins")
    .insert({
      dog_id: dogId,
      facility_id: contextResult.data.facilityId,
      checked_in_at: new Date().toISOString(),
      created_by: contextResult.data.userId,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: data as DogCheckinRow, error: null };
}

export async function checkOutDog(
  checkinId: string,
): Promise<CheckinsResult<DogCheckinRow>> {
  const contextResult = await requireFacilityContext();
  if (contextResult.error) {
    return { data: null, error: contextResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data: existing, error: existingError } = await supabase
    .from("dog_checkins")
    .select("*")
    .eq("id", checkinId)
    .eq("facility_id", contextResult.data.facilityId)
    .maybeSingle();

  if (existingError) {
    return { data: null, error: toError(existingError.message) };
  }

  if (!existing) {
    return { data: null, error: toError("Check-in not found", "not_found") };
  }

  if (existing.checked_out_at) {
    return {
      data: null,
      error: toError("Dog is not checked in", "not_checked_in"),
    };
  }

  const checkedOutAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("dog_checkins")
    .update({ checked_out_at: checkedOutAt })
    .eq("id", checkinId)
    .eq("facility_id", contextResult.data.facilityId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: data as DogCheckinRow, error: null };
}
