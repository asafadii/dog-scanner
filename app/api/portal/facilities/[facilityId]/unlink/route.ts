import { verifyPortalAccessToken } from "@/lib/portal/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ facilityId: string }> },
) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;
  const { facilityId } = await params;

  if (!facilityId) {
    return NextResponse.json(
      { ok: false, error: "facilityId is required" },
      { status: 400 },
    );
  }

  const { data: account, error: accountError } = await db
    .from("client_accounts")
    .select("archived_at")
    .eq("id", user.id)
    .maybeSingle();

  if (accountError) {
    return NextResponse.json(
      { ok: false, error: accountError.message },
      { status: 500 },
    );
  }

  if (!account) {
    return NextResponse.json(
      { ok: false, error: "Account not found" },
      { status: 404 },
    );
  }

  if ((account as { archived_at: string | null }).archived_at) {
    return NextResponse.json(
      { ok: false, error: "This account has been closed." },
      { status: 403 },
    );
  }

  const { error: deleteError } = await db
    .from("client_account_links")
    .delete()
    .eq("client_account_id", user.id)
    .eq("facility_id", facilityId);

  if (deleteError) {
    return NextResponse.json(
      { ok: false, error: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: true });
}
