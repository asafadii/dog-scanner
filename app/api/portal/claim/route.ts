import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
} from "@/lib/supabase/server";
import type {
  ClaimAccountErrorResponse,
  ClaimAccountSuccessResponse,
} from "@/lib/portal/claim";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

interface ClaimBody {
  inviteCode?: string;
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const IP_FAILED_LIMIT = 10;
const USER_FAILED_LIMIT = 5;
const RATE_LIMIT_MESSAGE = "Too many attempts. Please try again later.";

function resolveClientAccountFields(user: User): {
  email: string;
  fullName: string;
} | null {
  const metadata = user.user_metadata ?? {};
  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email) return null;

  const metadataFullName =
    typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";

  const fullName =
    metadataFullName || email.split("@")[0] || "Client";

  return { email, fullName };
}

function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function rateLimitWindowStart(): string {
  return new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
}

async function logClaimAttempt(
  db: SupabaseClient,
  ipAddress: string,
  userId: string | null,
  succeeded: boolean,
): Promise<void> {
  await db.from("claim_attempts").insert({
    ip_address: ipAddress,
    user_id: userId,
    succeeded,
  });
}

async function isRateLimited(
  db: SupabaseClient,
  ipAddress: string,
  userId: string,
): Promise<boolean> {
  const windowStart = rateLimitWindowStart();

  if (ipAddress !== "unknown") {
    const { count: ipFailedCount, error: ipCountError } = await db
      .from("claim_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ipAddress)
      .eq("succeeded", false)
      .gt("attempted_at", windowStart);

    if (ipCountError) {
      throw new Error(ipCountError.message);
    }

    if ((ipFailedCount ?? 0) >= IP_FAILED_LIMIT) {
      return true;
    }
  }

  const { count: userFailedCount, error: userCountError } = await db
    .from("claim_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("succeeded", false)
    .gt("attempted_at", windowStart);

  if (userCountError) {
    throw new Error(userCountError.message);
  }

  return (userFailedCount ?? 0) >= USER_FAILED_LIMIT;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Missing authorization token" } satisfies ClaimAccountErrorResponse,
      { status: 401 },
    );
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Missing authorization token" } satisfies ClaimAccountErrorResponse,
      { status: 401 },
    );
  }

  let body: ClaimBody = {};
  try {
    body = (await request.json()) as ClaimBody;
  } catch {
    body = {};
  }

  const inviteCode = body.inviteCode?.trim().toUpperCase();

  const authClient = createSupabaseAnonClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired session" } satisfies ClaimAccountErrorResponse,
      { status: 401 },
    );
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Server configuration error" } satisfies ClaimAccountErrorResponse,
      { status: 500 },
    );
  }

  const ipAddress = extractClientIp(request);

  try {
    if (await isRateLimited(db, ipAddress, user.id)) {
      await logClaimAttempt(db, ipAddress, user.id, false);
      return NextResponse.json(
        { ok: false, error: RATE_LIMIT_MESSAGE } satisfies ClaimAccountErrorResponse,
        { status: 429 },
      );
    }
  } catch (rateLimitError) {
    return NextResponse.json(
      {
        ok: false,
        error:
          rateLimitError instanceof Error
            ? rateLimitError.message
            : "Rate limit check failed",
      } satisfies ClaimAccountErrorResponse,
      { status: 500 },
    );
  }

  if (!inviteCode) {
    await logClaimAttempt(db, ipAddress, user.id, false);
    return NextResponse.json(
      { ok: false, error: "Invite code is required" } satisfies ClaimAccountErrorResponse,
      { status: 400 },
    );
  }

  const { data: existingAccount } = await db
    .from("client_accounts")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingAccount) {
    const fields = resolveClientAccountFields(user);
    if (!fields) {
      await logClaimAttempt(db, ipAddress, user.id, false);
      return NextResponse.json(
        { ok: false, error: "Authenticated user email is required" } satisfies ClaimAccountErrorResponse,
        { status: 400 },
      );
    }

    const { error: createAccountError } = await db.from("client_accounts").insert({
      id: user.id,
      email: fields.email,
      full_name: fields.fullName,
    });

    if (createAccountError && createAccountError.code !== "23505") {
      await logClaimAttempt(db, ipAddress, user.id, false);
      return NextResponse.json(
        { ok: false, error: createAccountError.message } satisfies ClaimAccountErrorResponse,
        { status: 500 },
      );
    }
  }

  const { data: client, error: clientError } = await db
    .from("clients")
    .select("id, facility_id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (clientError) {
    await logClaimAttempt(db, ipAddress, user.id, false);
    return NextResponse.json(
      { ok: false, error: clientError.message } satisfies ClaimAccountErrorResponse,
      { status: 500 },
    );
  }

  if (!client) {
    await logClaimAttempt(db, ipAddress, user.id, false);
    return NextResponse.json(
      { ok: false, error: "Invalid invite code" } satisfies ClaimAccountErrorResponse,
      { status: 404 },
    );
  }

  const { data: existingLink } = await db
    .from("client_account_links")
    .select("id")
    .eq("client_account_id", user.id)
    .eq("client_id", client.id)
    .maybeSingle();

  if (existingLink) {
    await logClaimAttempt(db, ipAddress, user.id, true);
    const response: ClaimAccountSuccessResponse = {
      ok: true,
      alreadyLinked: true,
      clientId: client.id,
      facilityId: client.facility_id,
    };
    return NextResponse.json(response);
  }

  const { error: linkError } = await db.from("client_account_links").insert({
    client_account_id: user.id,
    client_id: client.id,
    facility_id: client.facility_id,
  });

  if (linkError) {
    await logClaimAttempt(db, ipAddress, user.id, false);
    return NextResponse.json(
      { ok: false, error: linkError.message } satisfies ClaimAccountErrorResponse,
      { status: 500 },
    );
  }

  await logClaimAttempt(db, ipAddress, user.id, true);
  const response: ClaimAccountSuccessResponse = {
    ok: true,
    clientId: client.id,
    facilityId: client.facility_id,
  };
  return NextResponse.json(response, { status: 201 });
}
