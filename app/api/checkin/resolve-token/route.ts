import { verifyStaffAccessToken } from "@/lib/staff/server";
import type { ResolveCheckinTokenSuccessResponse } from "@/lib/checkin/resolveToken";
import { NextResponse } from "next/server";

interface ResolveTokenBody {
  token?: string;
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

  let body: ResolveTokenBody = {};
  try {
    body = (await request.json()) as ResolveTokenBody;
  } catch {
    body = {};
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "token is required" },
      { status: 400 },
    );
  }

  const { data: checkinToken, error: lookupError } = await db
    .from("checkin_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { ok: false, error: lookupError.message },
      { status: 500 },
    );
  }

  if (!checkinToken) {
    return NextResponse.json(
      { ok: false, error: "Check-in code not found." },
      { status: 404 },
    );
  }

  if (checkinToken.used_at) {
    return NextResponse.json(
      { ok: false, error: "This check-in code has already been used." },
      { status: 400 },
    );
  }

  if (new Date(checkinToken.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, error: "This check-in code has expired." },
      { status: 400 },
    );
  }

  if (checkinToken.facility_id !== profile.facility_id) {
    return NextResponse.json(
      { ok: false, error: "This check-in code belongs to a different facility." },
      { status: 403 },
    );
  }

  const usedAt = new Date().toISOString();
  const { data: updatedToken, error: updateError } = await db
    .from("checkin_tokens")
    .update({ used_at: usedAt, used_by: profile.id })
    .eq("id", checkinToken.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 },
    );
  }

  if (!updatedToken) {
    return NextResponse.json(
      { ok: false, error: "This check-in code has already been used." },
      { status: 400 },
    );
  }

  const response: ResolveCheckinTokenSuccessResponse = {
    ok: true,
    dogId: checkinToken.dog_id,
    bookingId: checkinToken.booking_id,
  };
  return NextResponse.json(response);
}
