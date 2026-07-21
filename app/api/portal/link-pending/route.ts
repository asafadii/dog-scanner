import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
} from "@/lib/supabase/server";
import type { ClientRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function resolveClientAccountFields(user: User): {
  email: string;
  fullName: string;
} | null {
  const metadata = user.user_metadata ?? {};
  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email) return null;

  const metadataFullName =
    typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";

  const fullName = metadataFullName || email.split("@")[0] || "Client";

  return { email, fullName };
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ data: { linkedCount: 0 } });
    }

    const accessToken = authHeader.slice("Bearer ".length).trim();
    if (!accessToken) {
      return NextResponse.json({ data: { linkedCount: 0 } });
    }

    const authClient = createSupabaseAnonClient();
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ data: { linkedCount: 0 } });
    }

    const accountFields = resolveClientAccountFields(user);
    if (!accountFields) {
      return NextResponse.json({ data: { linkedCount: 0 } });
    }

    const db = createSupabaseAdminClient();
    if (!db) {
      console.error("[link-pending] Server configuration error");
      return NextResponse.json({ data: { linkedCount: 0 } });
    }

    const { data: existingAccount } = await db
      .from("client_accounts")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingAccount) {
      const { error: createAccountError } = await db
        .from("client_accounts")
        .insert({
          id: user.id,
          email: accountFields.email,
          full_name: accountFields.fullName,
        });

      if (createAccountError && createAccountError.code !== "23505") {
        console.error(
          "[link-pending] Failed to create client_accounts:",
          createAccountError.message,
        );
        return NextResponse.json({ data: { linkedCount: 0 } });
      }
    }

    const { data: matchingClients, error: clientsError } = await db
      .from("clients")
      .select("id, facility_id")
      .ilike("email", accountFields.email)
      .is("archived_at", null);

    if (clientsError) {
      console.error("[link-pending] Client lookup failed:", clientsError.message);
      return NextResponse.json({ data: { linkedCount: 0 } });
    }

    const clients = (matchingClients ?? []) as Pick<
      ClientRow,
      "id" | "facility_id"
    >[];

    if (clients.length === 0) {
      return NextResponse.json({ data: { linkedCount: 0 } });
    }

    const { data: existingLinks, error: linksError } = await db
      .from("client_account_links")
      .select("facility_id")
      .eq("client_account_id", user.id);

    if (linksError) {
      console.error("[link-pending] Links lookup failed:", linksError.message);
      return NextResponse.json({ data: { linkedCount: 0 } });
    }

    const linkedFacilityIds = new Set(
      (existingLinks ?? []).map(
        (row) => (row as { facility_id: string }).facility_id,
      ),
    );

    const toLink = clients.filter(
      (client) => !linkedFacilityIds.has(client.facility_id),
    );

    let linkedCount = 0;

    for (const client of toLink) {
      const { error: insertError } = await db
        .from("client_account_links")
        .insert({
          client_account_id: user.id,
          client_id: client.id,
          facility_id: client.facility_id,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          continue;
        }
        console.error(
          "[link-pending] Link insert failed:",
          insertError.message,
          { clientId: client.id, facilityId: client.facility_id },
        );
        continue;
      }

      linkedCount += 1;
    }

    return NextResponse.json({ data: { linkedCount } });
  } catch (err) {
    console.error(
      "[link-pending] Unexpected error:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ data: { linkedCount: 0 } });
  }
}
