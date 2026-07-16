import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import { buildStaffInviteHtml } from "@/lib/email";
import { verifyStaffAccessToken } from "@/lib/staff/server";
import type { FacilityRow } from "@/lib/supabase/types";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

function generateInviteToken(): string {
  return randomBytes(24).toString("hex");
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

  if (profile.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Only facility admins can invite staff." },
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

  const email =
    body &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).email === "string"
      ? (body as Record<string, string>).email.trim().toLowerCase()
      : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "A valid email is required" },
      { status: 400 },
    );
  }

  const { data: facility, error: facilityError } = await db
    .from("facilities")
    .select("*")
    .eq("id", profile.facility_id)
    .maybeSingle();

  if (facilityError) {
    return NextResponse.json(
      { ok: false, error: facilityError.message },
      { status: 500 },
    );
  }

  if (!facility) {
    return NextResponse.json(
      { ok: false, error: "Facility not found" },
      { status: 404 },
    );
  }

  const facilityRow = facility as FacilityRow;

  const { count: staffCount, error: countError } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("facility_id", profile.facility_id);

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

  const { data: existingProfile } = await db
    .from("profiles")
    .select("id")
    .eq("facility_id", profile.facility_id)
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json(
      { ok: false, error: "A staff member with this email already exists." },
      { status: 400 },
    );
  }

  const token = generateInviteToken();
  const { error: insertError } = await db.from("staff_invites").insert({
    facility_id: profile.facility_id,
    email,
    token,
    invited_by: profile.id,
  });

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: insertError.message },
      { status: 500 },
    );
  }

  const facilityName = facilityRow.name?.trim() || "your facility";
  const signupUrl = `${APP_URL}/staff-signup?token=${encodeURIComponent(token)}`;

  await sendTransactionalEmail({
    to: email,
    subject: `You've been invited to join ${facilityName} on DORA`,
    html: buildStaffInviteHtml({ facilityName, signupUrl }),
  });

  return NextResponse.json({ ok: true });
}
