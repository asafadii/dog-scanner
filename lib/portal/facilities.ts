import { portalFetch } from "@/lib/portal/api";

export type PortalFacilitiesErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "account_closed"
  | "not_found"
  | "unknown";

export interface PortalFacilitiesError {
  message: string;
  code: PortalFacilitiesErrorCode;
}

type PortalFacilitiesResult<T> =
  | { data: T; error: null }
  | { data: null; error: PortalFacilitiesError };

function toError(
  message: string,
  code: PortalFacilitiesErrorCode = "unknown",
): PortalFacilitiesError {
  return { message, code };
}

type UnlinkFacilityResponse =
  | { ok: true; data: true }
  | { ok: false; error: string };

export async function unlinkFacility(
  facilityId: string,
): Promise<PortalFacilitiesResult<true>> {
  try {
    const response = await portalFetch(
      `/api/portal/facilities/${facilityId}/unlink`,
      { method: "DELETE" },
    );
    const data = (await response.json()) as UnlinkFacilityResponse;

    if (!response.ok || !data.ok) {
      const message =
        !data.ok && "error" in data
          ? data.error
          : "Failed to unlink facility";
      return {
        data: null,
        error: toError(
          message,
          response.status === 403 ? "unauthorized" : "unknown",
        ),
      };
    }

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: toError(
        error instanceof Error ? error.message : "Failed to unlink facility",
      ),
    };
  }
}
