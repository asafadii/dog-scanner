import { verifyStaffAccessToken } from "@/lib/staff/server";
import type { ProfileRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
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
      { ok: false, error: "Only facility admins can promote staff." },
      { status: 403 },
    );
  }

  const { userId } = await context.params;
  const targetUserId = userId?.trim();
  if (!targetUserId) {
    return NextResponse.json(
      { ok: false, error: "userId is required" },
      { status: 400 },
    );
  }

  if (targetUserId === profile.id) {
    return NextResponse.json(
      { ok: false, error: "You are already an admin." },
      { status: 400 },
    );
  }

  const { data: target, error: targetError } = await db
    .from("profiles")
    .select("*")
    .eq("id", targetUserId)
    .eq("facility_id", profile.facility_id)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json(
      { ok: false, error: targetError.message },
      { status: 500 },
    );
  }

  if (!target) {
    return NextResponse.json(
      { ok: false, error: "Staff member not found" },
      { status: 404 },
    );
  }

  const targetRow = target as ProfileRow;
  if (targetRow.role === "admin") {
    return NextResponse.json({ ok: true });
  }

  const { error: updateError } = await db
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", targetUserId)
    .eq("facility_id", profile.facility_id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
