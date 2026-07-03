import { verifyStaffAccessToken } from "@/lib/staff/server";
import { VACCINATION_DOCUMENTS_BUCKET } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await verifyStaffAccessToken(_request);
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

  const { error: storageError } = await db.storage
    .from(VACCINATION_DOCUMENTS_BUCKET)
    .remove([document.file_path]);

  if (storageError) {
    return NextResponse.json(
      { ok: false, error: storageError.message },
      { status: 500 },
    );
  }

  const { error: deleteError } = await db
    .from("dog_documents")
    .delete()
    .eq("id", documentId)
    .eq("facility_id", profile.facility_id);

  if (deleteError) {
    return NextResponse.json(
      { ok: false, error: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
