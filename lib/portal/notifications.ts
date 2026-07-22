import { portalFetch } from "@/lib/portal/api";

export type PortalNotificationErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "account_closed"
  | "not_found"
  | "unknown";

export interface PortalNotificationError {
  message: string;
  code: PortalNotificationErrorCode;
}

type PortalNotificationResult<T> =
  | { data: T; error: null }
  | { data: null; error: PortalNotificationError };

function toError(
  message: string,
  code: PortalNotificationErrorCode = "unknown",
): PortalNotificationError {
  return { message, code };
}

export interface NotificationPreferences {
  emailRemindersEnabled: boolean;
}

type NotificationPreferencesResponse =
  | { ok: true; data: NotificationPreferences }
  | { ok: false; error: string };

export async function getNotificationPreferences(): Promise<
  PortalNotificationResult<NotificationPreferences>
> {
  try {
    const response = await portalFetch("/api/portal/notification-preferences");
    const data = (await response.json()) as NotificationPreferencesResponse;

    if (!response.ok || !data.ok) {
      const message =
        !data.ok && "error" in data
          ? data.error
          : "Failed to load notification preferences";
      return {
        data: null,
        error: toError(
          message,
          response.status === 403 ? "unauthorized" : "unknown",
        ),
      };
    }

    return { data: data.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: toError(
        error instanceof Error
          ? error.message
          : "Failed to load notification preferences",
      ),
    };
  }
}

export async function updateNotificationPreferences(
  emailRemindersEnabled: boolean,
): Promise<PortalNotificationResult<NotificationPreferences>> {
  try {
    const response = await portalFetch("/api/portal/notification-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailRemindersEnabled }),
    });
    const data = (await response.json()) as NotificationPreferencesResponse;

    if (!response.ok || !data.ok) {
      const message =
        !data.ok && "error" in data
          ? data.error
          : "Failed to update notification preferences";
      return {
        data: null,
        error: toError(
          message,
          response.status === 403 ? "unauthorized" : "unknown",
        ),
      };
    }

    return { data: data.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: toError(
        error instanceof Error
          ? error.message
          : "Failed to update notification preferences",
      ),
    };
  }
}
