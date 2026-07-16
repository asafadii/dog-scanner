import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { FacilityRow, StaffInviteRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return NextResponse.json(
      { data: null, error: "Invite token is required" },
      { status: 400 },
    );
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { data: null, error: "Server configuration error" },
      { status: 500 },
    );
  }

  const { data: invite, error: inviteError } = await db
    .from("staff_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteError) {
    return NextResponse.json(
      { data: null, error: inviteError.message },
      { status: 500 },
    );
  }

  if (!invite) {
    return NextResponse.json(
      { data: null, error: "This invite link is invalid or has expired." },
      { status: 404 },
    );
  }

  const inviteRow = invite as StaffInviteRow;
  if (inviteRow.accepted_at) {
    return NextResponse.json(
      { data: null, error: "This invite link has already been used." },
      { status: 410 },
    );
  }

  const { data: facility, error: facilityError } = await db
    .from("facilities")
    .select("name")
    .eq("id", inviteRow.facility_id)
    .maybeSingle();

  if (facilityError) {
    return NextResponse.json(
      { data: null, error: facilityError.message },
      { status: 500 },
    );
  }

  const facilityName =
    (facility as Pick<FacilityRow, "name"> | null)?.name?.trim() ||
    "your facility";

  return NextResponse.json({
    data: {
      email: inviteRow.email,
      facilityName,
    },
    error: null,
  });
}
