import { verifyPortalAccessToken } from "@/lib/portal/server";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import type { ClientAccountRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db, accessToken } = authResult.data;

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

  if ((existing as Pick<ClientAccountRow, "archived_at">).archived_at) {
    return NextResponse.json(
      { ok: false, error: "This account has been closed." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const newEmail =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!newEmail || !isPlausibleEmail(newEmail)) {
    return NextResponse.json(
      { ok: false, error: "A valid email is required" },
      { status: 400 },
    );
  }

  const currentEmail = user.email?.trim().toLowerCase() ?? "";
  if (currentEmail && newEmail === currentEmail) {
    return NextResponse.json(
      { ok: false, error: "New email must be different from your current email" },
      { status: 400 },
    );
  }

  const userClient = createSupabaseUserClient(accessToken);
  const { error: sessionError } = await userClient.auth.setSession({
    access_token: accessToken,
    refresh_token: "",
  });
  if (sessionError) {
    return NextResponse.json(
      { ok: false, error: sessionError.message },
      { status: 401 },
    );
  }

  const { error } = await userClient.auth.updateUser({ email: newEmail });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: error.status && error.status >= 400 ? error.status : 400 },
    );
  }

  return NextResponse.json({ ok: true, data: { email: newEmail } });
}
