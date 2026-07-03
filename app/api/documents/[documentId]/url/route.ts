import { verifyStaffAccessToken } from "@/lib/staff/server";
import { VACCINATION_DOCUMENTS_BUCKET } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const authResult = await verifyStaffAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { profile, db } = authResult.data;
  const { documentId } = await context.params;

  const { data: document, error: lookupError } = await db
    .from("dog_documents")
    .select("id, file_path, facility_id")
    .eq("id", documentId)
    .eq("facility_id", profile.facility_id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { ok: false, error: lookupError.message },
      { status: 500 },
    );
  }

  if (!document) {
    return NextResponse.json(
      { ok: false, error: "Document not found" },
      { status: 404 },
    );
  }

  const { data: signed, error: signError } = await db.storage
    .from(VACCINATION_DOCUMENTS_BUCKET)
    .createSignedUrl(document.file_path, 3600);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json(
      { ok: false, error: signError?.message ?? "Failed to create signed URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
