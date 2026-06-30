import {
  countProfilesForFacility,
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
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const DEFAULT_FACILITY_NAME = "My Dog Daycare";

function devLog(message: string, details?: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  if (details !== undefined) {
    console.log(`[auth/setup] ${message}`, details);
  } else {
    console.log(`[auth/setup] ${message}`);
  }
}

function parseSetupBody(body: unknown): AuthSetupRequest {
  if (!body || typeof body !== "object") return {};
  const record = body as Record<string, unknown>;
  const payload: AuthSetupRequest = {};

  if (typeof record.fullName === "string" && record.fullName.trim()) {
    payload.fullName = record.fullName.trim();
  }
  if (typeof record.facilityName === "string" && record.facilityName.trim()) {
    payload.facilityName = record.facilityName.trim();
  }
  if (typeof record.email === "string" && record.email.trim()) {
    payload.email = record.email.trim().toLowerCase();
  }
  if (typeof record.facilityId === "string" && record.facilityId.trim()) {
    payload.facilityId = record.facilityId.trim();
  }

  return payload;
}

function resolveSetupFields(
  user: User,
  body: AuthSetupRequest,
):
  | { ok: true; fullName: string; facilityName: string; email: string }
  | { ok: false; error: string; status: number } {
  const metadata = user.user_metadata ?? {};
  const userEmail = user.email?.trim().toLowerCase() ?? "";

  const email = body.email ?? userEmail;
  if (!email) {
    return { ok: false, error: "Authenticated user email is required", status: 400 };
  }

  if (userEmail && userEmail !== email) {
    return {
      ok: false,
      error: "Email does not match authenticated user",
      status: 403,
    };
  }

  const metadataFullName =
    typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const metadataFacilityName =
    typeof metadata.facility_name === "string"
      ? metadata.facility_name.trim()
      : "";

  const fullName =
    body.fullName ??
    (metadataFullName || email.split("@")[0] || "User");

  const facilityName =
    body.facilityName ??
    (metadataFacilityName || DEFAULT_FACILITY_NAME);

  return { ok: true, fullName, facilityName, email };
}

export async function POST(request: Request) {
  devLog("setup route called");

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

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const setupBody = parseSetupBody(body);

  const authClient = createSupabaseAnonClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken);

  if (userError || !user) {
    devLog("setup error: user verification failed", userError?.message);
    return NextResponse.json(
      { ok: false, error: "Invalid or expired session" },
      { status: 401 },
    );
  }

  devLog("user verified", { userId: user.id, email: user.email });

  const resolved = resolveSetupFields(user, setupBody);
  if (!resolved.ok) {
    devLog("setup error: invalid setup fields", resolved.error);
    return NextResponse.json(
      { ok: false, error: resolved.error },
      { status: resolved.status },
    );
  }

  const { fullName, facilityName, email } = resolved;

  const db = createSupabaseAdminClient();
  if (!db) {
    devLog("setup error: missing service role key");
    return NextResponse.json(
      { ok: false, error: "Server configuration error" },
      { status: 500 },
    );
  }

  const { data: existingProfile, error: existingError } =
    await findProfileByUserId(db, user.id);

  if (existingError) {
    devLog("setup error: profile lookup failed", existingError.message);
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
      devLog("setup error: profile exists but facility missing", {
        profileId: existingProfile.id,
        facilityId: existingProfile.facility_id,
      });
      return NextResponse.json(
        { ok: false, error: "Profile exists but facility is missing" },
        { status: 500 },
      );
    }

    devLog("profile already existed", {
      profileId: existingProfile.id,
      facilityId: facility.id,
    });

    const response: AuthSetupSuccessResponse = {
      ok: true,
      alreadyExists: true,
      facility,
      profile: existingProfile,
    };
    return NextResponse.json(response);
  }

  // STAFF_LIMIT_GATE: enforced here when staff join flow is implemented.
  // Staff joining an existing facility (facilityId in request) — not admin signup.
  if (setupBody.facilityId) {
    const { data: existingFacility, error: joinFacilityError } =
      await findFacilityById(db, setupBody.facilityId);

    if (joinFacilityError || !existingFacility) {
      devLog("setup error: join facility not found", setupBody.facilityId);
      return NextResponse.json(
        { ok: false, error: "Facility not found" },
        { status: 404 },
      );
    }

    const { data: staffCount, error: countError } =
      await countProfilesForFacility(db, existingFacility.id);

    if (countError) {
      devLog("setup error: staff count failed", countError.message);
      return NextResponse.json(
        { ok: false, error: countError.message },
        { status: 500 },
      );
    }

    if (staffCount >= existingFacility.staff_limit) {
      return NextResponse.json(
        { ok: false, error: "Staff limit reached for this plan" },
        { status: 403 },
      );
    }

    const {
      data: staffProfile,
      error: staffProfileError,
      code: staffProfileErrorCode,
    } = await createProfile(db, {
      id: user.id,
      facility_id: existingFacility.id,
      full_name: fullName,
      email,
      role: "staff",
    });

    if (staffProfileError || !staffProfile) {
      if (staffProfileErrorCode === "23505") {
        const { data: racedProfile } = await findProfileByUserId(db, user.id);
        if (racedProfile) {
          const { data: racedFacility } = await findFacilityById(
            db,
            racedProfile.facility_id,
          );
          if (racedFacility) {
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

      devLog("setup error: staff profile creation failed", {
        message: staffProfileError?.message,
        code: staffProfileErrorCode,
      });
      return NextResponse.json(
        {
          ok: false,
          error: staffProfileError?.message ?? "Failed to create profile",
        },
        { status: 500 },
      );
    }

    devLog("staff profile created", {
      profileId: staffProfile.id,
      facilityId: existingFacility.id,
    });

    const response: AuthSetupSuccessResponse = {
      ok: true,
      facility: existingFacility,
      profile: staffProfile,
    };
    return NextResponse.json(response, { status: 201 });
  }

  const { data: facility, error: facilityError } = await createFacility(
    db,
    facilityName,
  );

  if (facilityError || !facility) {
    devLog("setup error: facility creation failed", facilityError?.message);
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
          devLog("profile already existed (race)", {
            profileId: racedProfile.id,
            facilityId: racedFacility.id,
          });
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

    devLog("setup error: profile creation failed", {
      message: profileError?.message,
      code: profileErrorCode,
    });
    return NextResponse.json(
      {
        ok: false,
        error: profileError?.message ?? "Failed to create profile",
      },
      { status: 500 },
    );
  }

  devLog("profile created", {
    profileId: profile.id,
    facilityId: facility.id,
  });

  const response: AuthSetupSuccessResponse = {
    ok: true,
    facility,
    profile,
  };
  return NextResponse.json(response, { status: 201 });
}
