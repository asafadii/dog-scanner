import { portalFetch } from "@/lib/portal/api";

export type PortalProfileErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "unknown";

export interface PortalProfileError {
  message: string;
  code: PortalProfileErrorCode;
}

type PortalProfileResult<T> =
  | { data: T; error: null }
  | { data: null; error: PortalProfileError };

function toError(
  message: string,
  code: PortalProfileErrorCode = "unknown",
): PortalProfileError {
  return { message, code };
}

export interface PortalProfileData {
  facilityId: string;
  facilityName: string;
  clientId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface PortalProfileUpdateInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

type GetProfileResponse =
  | { ok: true; profile: PortalProfileData }
  | { ok: false; error: string };

type UpdateProfileResponse =
  | { ok: true; data: true; profile: PortalProfileData }
  | { ok: false; error: string };

export async function getPortalProfile(
  facilityId?: string,
): Promise<PortalProfileResult<PortalProfileData>> {
  try {
    const query = facilityId
      ? `?facilityId=${encodeURIComponent(facilityId)}`
      : "";
    const response = await portalFetch(`/api/portal/profile${query}`);
    const data = (await response.json()) as GetProfileResponse;

    if (!response.ok || !data.ok) {
      const message =
        !data.ok && "error" in data
          ? data.error
          : "Failed to load contact details";
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

    return { data: data.profile, error: null };
  } catch (error) {
    return {
      data: null,
      error: toError(
        error instanceof Error ? error.message : "Failed to load contact details",
      ),
    };
  }
}

export async function updatePortalProfile(
  facilityId: string,
  input: PortalProfileUpdateInput,
): Promise<PortalProfileResult<PortalProfileData>> {
  try {
    const response = await portalFetch("/api/portal/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facilityId, ...input }),
    });
    const data = (await response.json()) as UpdateProfileResponse;

    if (!response.ok || !data.ok) {
      const message =
        !data.ok && "error" in data
          ? data.error
          : "Failed to save contact details";
      return {
        data: null,
        error: toError(
          message,
          response.status === 403 ? "unauthorized" : "unknown",
        ),
      };
    }

    return { data: data.profile, error: null };
  } catch (error) {
    return {
      data: null,
      error: toError(
        error instanceof Error
          ? error.message
          : "Failed to save contact details",
      ),
    };
  }
}
