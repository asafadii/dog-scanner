import type { PortalProfileData } from "@/lib/portal/profile";
import { verifyPortalAccessToken } from "@/lib/portal/server";
import type { ClientRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

function mapProfile(
  client: ClientRow,
  facilityId: string,
  facilityName: string,
): PortalProfileData {
  return {
    facilityId,
    facilityName,
    clientId: client.id,
    name: client.name ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    address: client.address ?? "",
    emergencyContact: client.emergency_contact ?? "",
    emergencyPhone: client.emergency_phone ?? "",
  };
}

export async function GET(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;
  const { searchParams } = new URL(request.url);
  const facilityIdParam = searchParams.get("facilityId")?.trim() || null;

  const { data: links, error: linksError } = await db
    .from("client_account_links")
    .select("client_id, facility_id")
    .eq("client_account_id", user.id);

  if (linksError) {
    return NextResponse.json(
      { ok: false, error: linksError.message },
      { status: 500 },
    );
  }

  if (!links || links.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No linked facility found" },
      { status: 404 },
    );
  }

  const preferred =
    (facilityIdParam
      ? links.find((row) => row.facility_id === facilityIdParam)
      : null) ?? links[0];

  const [clientResult, facilityResult] = await Promise.all([
    db
      .from("clients")
      .select("*")
      .eq("id", preferred.client_id)
      .is("archived_at", null)
      .maybeSingle(),
    db
      .from("facilities")
      .select("id, name")
      .eq("id", preferred.facility_id)
      .maybeSingle(),
  ]);

  if (clientResult.error) {
    return NextResponse.json(
      { ok: false, error: clientResult.error.message },
      { status: 500 },
    );
  }

  if (facilityResult.error) {
    return NextResponse.json(
      { ok: false, error: facilityResult.error.message },
      { status: 500 },
    );
  }

  if (!clientResult.data) {
    return NextResponse.json(
      { ok: false, error: "Client profile not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    profile: mapProfile(
      clientResult.data as ClientRow,
      preferred.facility_id,
      facilityResult.data?.name?.trim() || "Unknown facility",
    ),
  });
}

interface PatchPortalProfileBody {
  facilityId?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export async function PATCH(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;

  let body: PatchPortalProfileBody;
  try {
    body = (await request.json()) as PatchPortalProfileBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const facilityId = body.facilityId?.trim();
  if (!facilityId) {
    return NextResponse.json(
      { ok: false, error: "facilityId is required" },
      { status: 400 },
    );
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Name is required" },
      { status: 400 },
    );
  }

  const { data: link, error: linkError } = await db
    .from("client_account_links")
    .select("client_id, facility_id")
    .eq("client_account_id", user.id)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (linkError) {
    return NextResponse.json(
      { ok: false, error: linkError.message },
      { status: 500 },
    );
  }

  if (!link) {
    return NextResponse.json(
      { ok: false, error: "Not authorized" },
      { status: 403 },
    );
  }

  const { data: updated, error: updateError } = await db
    .from("clients")
    .update({
      name,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      address: body.address?.trim() || null,
      emergency_contact: body.emergencyContact?.trim() || null,
      emergency_phone: body.emergencyPhone?.trim() || null,
    })
    .eq("id", link.client_id)
    .eq("facility_id", facilityId)
    .is("archived_at", null)
    .select("*")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 },
    );
  }

  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "Client profile not found" },
      { status: 404 },
    );
  }

  const { data: facility } = await db
    .from("facilities")
    .select("name")
    .eq("id", facilityId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    data: true,
    profile: mapProfile(
      updated as ClientRow,
      facilityId,
      facility?.name?.trim() || "Unknown facility",
    ),
  });
}
