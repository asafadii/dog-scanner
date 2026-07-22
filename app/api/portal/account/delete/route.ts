import { verifyPortalAccessToken } from "@/lib/portal/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;

  const { data: existing, error: fetchError } = await db
    .from("client_accounts")
    .select("archived_at")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { ok: false, error: fetchError.message },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Account not found" },
      { status: 404 },
    );
  }

  if ((existing as { archived_at: string | null }).archived_at) {
    return NextResponse.json(
      { ok: false, error: "This account has already been closed." },
      { status: 400 },
    );
  }

  const { error: updateError } = await db
    .from("client_accounts")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: true });
}
