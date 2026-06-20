import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ClientAccountRow,
  ClientRow,
  FacilityRow,
} from "@/lib/supabase/types";
import type { Client } from "@/lib/types";
import { mapClientRowToClient } from "@/lib/clients";

export const INCOMPLETE_CLIENT_SETUP_MESSAGE =
  "Your client account setup is incomplete.";

export type PortalErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "unknown";

export interface PortalError {
  message: string;
  code: PortalErrorCode;
}

type PortalResult<T> =
  | { data: T; error: null }
  | { data: null; error: PortalError };

function toError(
  message: string,
  code: PortalErrorCode = "unknown",
): PortalError {
  return { message, code };
}

export interface LinkedClient extends Client {
  facilityId: string;
  facilityName: string;
}

export async function requireClientAccount(): Promise<
  PortalResult<ClientAccountRow>
> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: toError("Not signed in", "unauthorized") };
  }

  const { data: account, error: accountError } = await supabase
    .from("client_accounts")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (accountError) {
    return { data: null, error: toError(accountError.message) };
  }

  if (!account) {
    return {
      data: null,
      error: toError(INCOMPLETE_CLIENT_SETUP_MESSAGE, "incomplete_setup"),
    };
  }

  return { data: account as ClientAccountRow, error: null };
}

export async function getLinkedClients(): Promise<PortalResult<LinkedClient[]>> {
  const accountResult = await requireClientAccount();
  if (accountResult.error) {
    return { data: null, error: accountResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data: links, error: linksError } = await supabase
    .from("client_account_links")
    .select("client_id, facility_id")
    .eq("client_account_id", accountResult.data.id);

  if (linksError) {
    return { data: null, error: toError(linksError.message) };
  }

  if (!links || links.length === 0) {
    return { data: [], error: null };
  }

  const clientIds = links.map((link) => link.client_id);
  const facilityIds = [...new Set(links.map((link) => link.facility_id))];

  const [clientsResult, facilitiesResult] = await Promise.all([
    supabase.from("clients").select("*").in("id", clientIds),
    supabase.from("facilities").select("id, name").in("id", facilityIds),
  ]);

  if (clientsResult.error) {
    return { data: null, error: toError(clientsResult.error.message) };
  }

  if (facilitiesResult.error) {
    return { data: null, error: toError(facilitiesResult.error.message) };
  }

  const facilityNameById = new Map(
    (facilitiesResult.data as Pick<FacilityRow, "id" | "name">[]).map(
      (facility) => [facility.id, facility.name],
    ),
  );

  const clientById = new Map(
    (clientsResult.data as ClientRow[]).map((row) => [row.id, row]),
  );

  const linked: LinkedClient[] = [];
  for (const link of links) {
    const clientRow = clientById.get(link.client_id);
    if (!clientRow) continue;

    linked.push({
      ...mapClientRowToClient(clientRow),
      facilityId: link.facility_id,
      facilityName: facilityNameById.get(link.facility_id) ?? "Unknown facility",
    });
  }

  return { data: linked, error: null };
}

export async function hasClientAccount(): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("client_accounts")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return Boolean(data);
}
