import {
  extractClientIp,
  isRateLimited,
  logClaimAttempt,
} from "@/lib/portal/rateLimit";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { FacilityRow, StaffInviteRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

function notPending() {
  return NextResponse.json({ pending: false });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  if (!email || !email.includes("@")) {
    return notPending();
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json({ pending: false }, { status: 500 });
  }

  const ipAddress = extractClientIp(request);

  try {
    if (await isRateLimited(db, ipAddress, null)) {
      await logClaimAttempt(db, ipAddress, null, false);
      return notPending();
    }
    await logClaimAttempt(db, ipAddress, null, false);
  } catch {
    return notPending();
  }

  const { data: invite, error: inviteError } = await db
    .from("staff_invites")
    .select("facility_id")
    .eq("email", email)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (inviteError) {
    return NextResponse.json({ pending: false }, { status: 500 });
  }

  if (!invite) {
    return notPending();
  }

  const inviteRow = invite as Pick<StaffInviteRow, "facility_id">;

  const { data: facility, error: facilityError } = await db
    .from("facilities")
    .select("name")
    .eq("id", inviteRow.facility_id)
    .maybeSingle();

  if (facilityError) {
    return NextResponse.json({ pending: false }, { status: 500 });
  }

  const facilityName =
    (facility as Pick<FacilityRow, "name"> | null)?.name?.trim() ||
    "your facility";

  return NextResponse.json({
    pending: true,
    facilityName,
  });
}
