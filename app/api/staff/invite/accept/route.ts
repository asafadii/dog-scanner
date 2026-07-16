import {
  createProfile,
  findProfileByUserId,
} from "@/lib/supabase/onboarding";
import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
} from "@/lib/supabase/server";
import type { FacilityRow, StaffInviteRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  const accessToken = match?.[1]?.trim();

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
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

  const token =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).token === "string"
      ? (body as Record<string, string>).token.trim()
      : "";
  const userId =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).userId === "string"
      ? (body as Record<string, string>).userId.trim()
      : "";
  const fullName =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).fullName === "string"
      ? (body as Record<string, string>).fullName.trim()
      : "";

  if (!token || !userId) {
    return NextResponse.json(
      { ok: false, error: "token and userId are required" },
      { status: 400 },
    );
  }

  if (!fullName) {
    return NextResponse.json(
      { ok: false, error: "fullName is required" },
      { status: 400 },
    );
  }

  const anon = createSupabaseAnonClient();
  const {
    data: { user },
    error: userError,
  } = await anon.auth.getUser(accessToken);

  if (userError || !user || user.id !== userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Server configuration error" },
      { status: 500 },
    );
  }

  const { data: existingProfile } = await findProfileByUserId(db, user.id);
  if (existingProfile) {
    return NextResponse.json(
      { ok: false, error: "This account is already linked to a facility." },
      { status: 400 },
    );
  }

  const { data: invite, error: inviteError } = await db
    .from("staff_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteError) {
    return NextResponse.json(
      { ok: false, error: inviteError.message },
      { status: 500 },
    );
  }

  if (!invite) {
    return NextResponse.json(
      { ok: false, error: "This invite link is invalid or has expired." },
      { status: 404 },
    );
  }

  const inviteRow = invite as StaffInviteRow;
  if (inviteRow.accepted_at) {
    return NextResponse.json(
      { ok: false, error: "This invite link has already been used." },
      { status: 410 },
    );
  }

  const userEmail = (user.email ?? "").trim().toLowerCase();
  if (!userEmail || userEmail !== inviteRow.email.toLowerCase()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Signed-up email does not match the invite.",
      },
      { status: 400 },
    );
  }

  const { data: facility, error: facilityError } = await db
    .from("facilities")
    .select("*")
    .eq("id", inviteRow.facility_id)
    .maybeSingle();

  if (facilityError || !facility) {
    return NextResponse.json(
      { ok: false, error: facilityError?.message ?? "Facility not found" },
      { status: facilityError ? 500 : 404 },
    );
  }

  const facilityRow = facility as FacilityRow;

  const { count: staffCount, error: countError } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("facility_id", inviteRow.facility_id);

  if (countError) {
    return NextResponse.json(
      { ok: false, error: countError.message },
      { status: 500 },
    );
  }

  if ((staffCount ?? 0) >= facilityRow.staff_limit) {
    return NextResponse.json(
      { ok: false, error: "Staff limit reached for your plan." },
      { status: 403 },
    );
  }

  const {
    data: staffProfile,
    error: profileError,
  } = await createProfile(db, {
    id: user.id,
    facility_id: inviteRow.facility_id,
    full_name: fullName,
    email: userEmail,
    role: "staff",
  });

  if (profileError || !staffProfile) {
    return NextResponse.json(
      {
        ok: false,
        error: profileError?.message ?? "Failed to create staff profile",
      },
      { status: 500 },
    );
  }

  const { error: acceptError } = await db
    .from("staff_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inviteRow.id)
    .is("accepted_at", null);

  if (acceptError) {
    return NextResponse.json(
      { ok: false, error: acceptError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
