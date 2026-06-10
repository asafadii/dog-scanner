import {
  createFacility,
  createProfile,
  deleteFacility,
  findFacilityById,
  findProfileByUserId,
} from "@/lib/supabase/onboarding";
import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
} from "@/lib/supabase/server";
import type {
  AuthSetupRequest,
  AuthSetupSuccessResponse,
} from "@/lib/supabase/types";
import { NextResponse } from "next/server";

function isValidSetupBody(body: unknown): body is AuthSetupRequest {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  return (
    typeof record.fullName === "string" &&
    record.fullName.trim().length > 0 &&
    typeof record.facilityName === "string" &&
    record.facilityName.trim().length > 0 &&
    typeof record.email === "string" &&
    record.email.trim().length > 0
  );
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Missing authorization token" },
      { status: 401 },
    );
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Missing authorization token" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!isValidSetupBody(body)) {
    return NextResponse.json(
      { ok: false, error: "fullName, facilityName, and email are required" },
      { status: 400 },
    );
  }

  const fullName = body.fullName.trim();
  const facilityName = body.facilityName.trim();
  const email = body.email.trim().toLowerCase();

  const authClient = createSupabaseAnonClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired session" },
      { status: 401 },
    );
  }

  if (user.email && user.email.toLowerCase() !== email) {
    return NextResponse.json(
      { ok: false, error: "Email does not match authenticated user" },
      { status: 403 },
    );
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Server configuration error" },
      { status: 500 },
    );
  }

  const { data: existingProfile, error: existingError } =
    await findProfileByUserId(db, user.id);

  if (existingError) {
    return NextResponse.json(
      { ok: false, error: existingError.message },
      { status: 500 },
    );
  }

  if (existingProfile) {
    const { data: facility, error: facilityError } = await findFacilityById(
      db,
      existingProfile.facility_id,
    );

    if (facilityError || !facility) {
      return NextResponse.json(
        { ok: false, error: "Profile exists but facility is missing" },
        { status: 500 },
      );
    }

    const response: AuthSetupSuccessResponse = {
      ok: true,
      alreadyExists: true,
      facility,
      profile: existingProfile,
    };
    return NextResponse.json(response);
  }

  const { data: facility, error: facilityError } = await createFacility(
    db,
    facilityName,
  );

  if (facilityError || !facility) {
    return NextResponse.json(
      { ok: false, error: facilityError?.message ?? "Failed to create facility" },
      { status: 500 },
    );
  }

  const {
    data: profile,
    error: profileError,
    code: profileErrorCode,
  } = await createProfile(db, {
    id: user.id,
    facility_id: facility.id,
    full_name: fullName,
    email,
    role: "admin",
  });

  if (profileError || !profile) {
    await deleteFacility(db, facility.id);

    if (profileErrorCode === "23505") {
      const { data: racedProfile } = await findProfileByUserId(db, user.id);

      if (racedProfile) {
        const { data: racedFacility } = await findFacilityById(
          db,
          racedProfile.facility_id,
        );
        if (racedFacility) {
          await deleteFacility(db, facility.id);
          const response: AuthSetupSuccessResponse = {
            ok: true,
            alreadyExists: true,
            facility: racedFacility,
            profile: racedProfile,
          };
          return NextResponse.json(response);
        }
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: profileError?.message ?? "Failed to create profile",
      },
      { status: 500 },
    );
  }

  const response: AuthSetupSuccessResponse = {
    ok: true,
    facility,
    profile,
  };
  return NextResponse.json(response, { status: 201 });
}
