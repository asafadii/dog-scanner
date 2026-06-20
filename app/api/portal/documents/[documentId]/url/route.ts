import {
  verifyDogLinkedToClientAccount,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import { VACCINATION_DOCUMENTS_BUCKET } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  const authResult = await verifyPortalAccessToken(_request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;
  const { documentId } = await context.params;

  const { data: document, error: documentError } = await db
    .from("dog_documents")
    .select("id, dog_id, file_path")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    return NextResponse.json(
      { ok: false, error: documentError.message },
      { status: 500 },
    );
  }

  if (!document) {
    return NextResponse.json(
      { ok: false, error: "Document not found" },
      { status: 404 },
    );
  }

  const dogResult = await verifyDogLinkedToClientAccount(db, user.id, document.dog_id);
  if (!dogResult.ok) {
    return NextResponse.json(
      { ok: false, error: dogResult.error },
      { status: dogResult.status },
    );
  }

  const { data: signed, error: signedError } = await db.storage
    .from(VACCINATION_DOCUMENTS_BUCKET)
    .createSignedUrl(document.file_path, 60 * 60);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json(
      { ok: false, error: signedError?.message ?? "Failed to create download URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
