import { staffFetch } from "@/lib/api";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRow, UserRole } from "@/lib/supabase/types";

export type StaffManageErrorCode =
  | "incomplete_setup"
  | "forbidden"
  | "not_found"
  | "unknown";

export interface StaffManageError {
  message: string;
  code: StaffManageErrorCode;
}

type StaffManageResult<T> =
  | { data: T; error: null }
  | { data: null; error: StaffManageError };

function toError(
  message: string,
  code: StaffManageErrorCode = "unknown",
): StaffManageError {
  return { message, code };
}

export function formatStaffRoleLabel(role: UserRole): string {
  return role === "admin" ? "Admin" : "Member";
}

/**
 * Returns whether demoting/removing this admin is allowed.
 * data: false + error when it would leave the facility with zero admins.
 */
export async function canRemoveOrDemoteAdmin(
  facilityId: string,
  targetUserId: string,
): Promise<StaffManageResult<boolean>> {
  const supabase = createSupabaseBrowserClient();

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, facility_id")
    .eq("id", targetUserId)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (targetError) {
    return { data: null, error: toError(targetError.message) };
  }

  if (!target) {
    return { data: null, error: toError("Staff member not found", "not_found") };
  }

  const targetRow = target as Pick<ProfileRow, "id" | "role" | "facility_id">;
  if (targetRow.role !== "admin") {
    return { data: true, error: null };
  }

  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("facility_id", facilityId)
    .eq("role", "admin");

  if (countError) {
    return { data: null, error: toError(countError.message) };
  }

  if ((count ?? 0) <= 1) {
    return {
      data: null,
      error: toError(
        "Transfer Admin to another team member first.",
        "forbidden",
      ),
    };
  }

  return { data: true, error: null };
}

export async function promoteToAdmin(
  userId: string,
): Promise<StaffManageResult<true>> {
  try {
    const response = await staffFetch(`/api/staff/${userId}/promote`, {
      method: "PATCH",
    });

    const body = (await response.json()) as {
      ok?: boolean;
      error?: string;
    };

    if (!response.ok || body.ok === false) {
      return {
        data: null,
        error: toError(
          body.error ?? "Failed to promote staff member",
          response.status === 403 ? "forbidden" : "unknown",
        ),
      };
    }

    return { data: true, error: null };
  } catch (err) {
    return {
      data: null,
      error: toError(
        err instanceof Error ? err.message : "Failed to promote staff member",
      ),
    };
  }
}

export async function sendStaffInvite(
  email: string,
  role: UserRole = "staff",
): Promise<StaffManageResult<true>> {
  try {
    const response = await staffFetch("/api/staff/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const body = (await response.json()) as {
      ok?: boolean;
      error?: string;
    };

    if (!response.ok || body.ok === false) {
      return {
        data: null,
        error: toError(
          body.error ?? "Failed to send invite",
          response.status === 403 ? "forbidden" : "unknown",
        ),
      };
    }

    return { data: true, error: null };
  } catch (err) {
    return {
      data: null,
      error: toError(
        err instanceof Error ? err.message : "Failed to send invite",
      ),
    };
  }
}
