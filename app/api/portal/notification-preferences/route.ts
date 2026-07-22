import { verifyPortalAccessToken } from "@/lib/portal/server";
import type { ClientAccountRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;

  const { data, error } = await db
    .from("client_accounts")
    .select("email_reminders_enabled, archived_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Account not found" },
      { status: 404 },
    );
  }

  const account = data as Pick<
    ClientAccountRow,
    "email_reminders_enabled" | "archived_at"
  >;

  if (account.archived_at) {
    return NextResponse.json(
      { ok: false, error: "This account has been closed." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: { emailRemindersEnabled: account.email_reminders_enabled },
  });
}

export async function PATCH(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const emailRemindersEnabled =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).emailRemindersEnabled === "boolean"
      ? ((body as { emailRemindersEnabled: boolean }).emailRemindersEnabled)
      : null;

  if (emailRemindersEnabled === null) {
    return NextResponse.json(
      { ok: false, error: "emailRemindersEnabled must be a boolean" },
      { status: 400 },
    );
  }

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

  const { data, error } = await db
    .from("client_accounts")
    .update({
      email_reminders_enabled: emailRemindersEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("email_reminders_enabled")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Account not found" },
      { status: 404 },
    );
  }

  const updated = data as Pick<ClientAccountRow, "email_reminders_enabled">;

  return NextResponse.json({
    ok: true,
    data: { emailRemindersEnabled: updated.email_reminders_enabled },
  });
}
