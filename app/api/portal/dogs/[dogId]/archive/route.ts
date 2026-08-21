import { archiveDogRecord } from "@/lib/dogs";
import {
  verifyClientAccountLink,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ dogId: string }> },
) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;
  const { dogId } = await context.params;

  if (!dogId) {
    return NextResponse.json(
      { ok: false, error: "dogId is required" },
      { status: 400 },
    );
  }

  let body: { clientId?: string; facilityId?: string };
  try {
    body = (await request.json()) as { clientId?: string; facilityId?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const clientId = body.clientId?.trim();
  const facilityId = body.facilityId?.trim();
  if (!clientId || !facilityId) {
    return NextResponse.json(
      { ok: false, error: "clientId and facilityId are required" },
      { status: 400 },
    );
  }

  const linked = await verifyClientAccountLink(db, user.id, clientId, facilityId);
  if (!linked) {
    return NextResponse.json(
      { ok: false, error: "Not authorized" },
      { status: 403 },
    );
  }

  const result = await archiveDogRecord(db, dogId, {
    facilityId,
    clientId,
    requireActive: true,
  });

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: result.error.code === "not_found" ? 404 : 500 },
    );
  }

  return NextResponse.json({ ok: true, data: true });
}
