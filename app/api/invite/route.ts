import { buildInviteEmailHtml } from "@/lib/email";
import { verifyStaffAccessToken } from "@/lib/staff/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ClientRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 8;

function generateInviteCodeValue(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += INVITE_CODE_CHARS[
      Math.floor(Math.random() * INVITE_CODE_CHARS.length)
    ];
  }
  return code;
}

async function generateInviteCodeForClient(
  db: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  clientId: string,
  facilityId: string,
): Promise<{ data: string; error: null } | { data: null; error: string }> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCodeValue();
    const { data, error } = await db
      .from("clients")
      .update({
        invite_code: inviteCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .eq("facility_id", facilityId)
      .select("invite_code")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") continue;
      return { data: null, error: error.message };
    }

    if (!data?.invite_code) {
      return { data: null, error: "Client not found" };
    }

    return { data: data.invite_code, error: null };
  }

  return { data: null, error: "Could not generate a unique invite code" };
}

export async function POST(request: Request) {
  const authResult = await verifyStaffAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { profile, db } = authResult.data;

  if (profile.role !== "admin" && profile.role !== "staff") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
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

  const clientId =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).clientId === "string"
      ? (body as Record<string, string>).clientId.trim()
      : "";

  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: "clientId is required" },
      { status: 400 },
    );
  }

  const { data: client, error: clientError } = await db
    .from("clients")
    .select("id, name, email, facility_id")
    .eq("id", clientId)
    .eq("facility_id", profile.facility_id)
    .maybeSingle();

  if (clientError) {
    return NextResponse.json(
      { ok: false, error: clientError.message },
      { status: 500 },
    );
  }

  const clientRow = client as Pick<
    ClientRow,
    "id" | "name" | "email" | "facility_id"
  > | null;

  if (!clientRow) {
    return NextResponse.json(
      { ok: false, error: "Client not found" },
      { status: 404 },
    );
  }

  if (!clientRow.email?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Client has no email address" },
      { status: 400 },
    );
  }

  const inviteResult = await generateInviteCodeForClient(
    db,
    clientId,
    profile.facility_id,
  );

  if (inviteResult.error) {
    return NextResponse.json(
      { ok: false, error: inviteResult.error },
      { status: 500 },
    );
  }

  const inviteCode = inviteResult.data;

  const { data: facility, error: facilityError } = await db
    .from("facilities")
    .select("name")
    .eq("id", profile.facility_id)
    .maybeSingle();

  if (facilityError) {
    return NextResponse.json(
      { ok: false, error: facilityError.message },
      { status: 500 },
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { ok: false, error: "Email service is not configured" },
      { status: 500 },
    );
  }

  const signupUrl = `${APP_URL}/portal/signup?email=${encodeURIComponent(clientRow.email)}&code=${inviteCode}`;
  const resend = new Resend(resendApiKey);

  const { error: emailError } = await resend.emails.send({
    from: "hello DORA <hello@hellodora.app>",
    to: clientRow.email,
    subject: "You've been invited to hello DORA",
    html: buildInviteEmailHtml({
      clientName: clientRow.name,
      facilityName: facility?.name ?? "your daycare",
      signupUrl,
    }),
  });

  if (emailError) {
    return NextResponse.json(
      { ok: false, error: emailError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
