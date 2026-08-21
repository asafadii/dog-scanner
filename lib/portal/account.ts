import { portalFetch } from "@/lib/portal/api";

export type PortalAccountErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "account_closed"
  | "not_found"
  | "unknown";

export interface PortalAccountError {
  message: string;
  code: PortalAccountErrorCode;
}

type PortalAccountResult<T> =
  | { data: T; error: null }
  | { data: null; error: PortalAccountError };

function toError(
  message: string,
  code: PortalAccountErrorCode = "unknown",
): PortalAccountError {
  return { message, code };
}

type DeleteAccountResponse =
  | { ok: true; data: true }
  | { ok: false; error: string };

type ChangeEmailResponse =
  | { ok: true; data: { email: string } }
  | { ok: false; error: string };

export async function deletePortalAccount(): Promise<
  PortalAccountResult<true>
> {
  try {
    const response = await portalFetch("/api/portal/account/delete", {
      method: "POST",
    });
    const data = (await response.json()) as DeleteAccountResponse;

    if (!response.ok || !data.ok) {
      const message =
        !data.ok && "error" in data
          ? data.error
          : "Failed to close account";
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
        error instanceof Error ? error.message : "Failed to close account",
      ),
    };
  }
}

export async function requestEmailChange(
  email: string,
): Promise<PortalAccountResult<{ email: string }>> {
  try {
    const response = await portalFetch("/api/portal/account/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as ChangeEmailResponse;

    if (!response.ok || !data.ok) {
      const message =
        !data.ok && "error" in data
          ? data.error
          : "Failed to request email change";
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
          : "Failed to request email change",
      ),
    };
  }
}
