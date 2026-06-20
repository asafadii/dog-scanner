import {
  detectFileSignature,
  DOCUMENT_ALLOWED_TYPES,
  DOCUMENT_MAX_BYTES,
  extensionForMimeType,
  mapDogDocumentRowToDogDocument,
} from "@/lib/portal/documents";
import type { UploadPortalDocumentSuccessResponse } from "@/lib/portal/documents";
import {
  verifyDogLinkedToClientAccount,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import { VACCINATION_DOCUMENTS_BUCKET } from "@/lib/supabase/types";
import type { DogDocumentType } from "@/lib/types";
import { NextResponse } from "next/server";

const DOCUMENT_TYPES: DogDocumentType[] = ["vaccination", "pedigree", "other"];
const CONTENT_MISMATCH_ERROR =
  "File content does not match a supported format.";

export async function POST(request: Request) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid form data" },
      { status: 400 },
    );
  }

  const dogId = String(formData.get("dogId") ?? "").trim();
  const documentType = String(formData.get("documentType") ?? "").trim() as DogDocumentType;
  const file = formData.get("file");

  if (!dogId) {
    return NextResponse.json(
      { ok: false, error: "dogId is required" },
      { status: 400 },
    );
  }

  if (!DOCUMENT_TYPES.includes(documentType)) {
    return NextResponse.json(
      { ok: false, error: "Invalid document type" },
      { status: 400 },
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "File is required" },
      { status: 400 },
    );
  }

  if (
    !DOCUMENT_ALLOWED_TYPES.includes(
      file.type as (typeof DOCUMENT_ALLOWED_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "Unsupported format. Please use PDF, JPG, PNG, or WEBP." },
      { status: 400 },
    );
  }

  if (file.size > DOCUMENT_MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File is too large. Please choose a file under 10 MB." },
      { status: 400 },
    );
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const detectedType = detectFileSignature(fileBuffer);

  if (
    !detectedType ||
    !DOCUMENT_ALLOWED_TYPES.includes(detectedType) ||
    detectedType !== file.type
  ) {
    return NextResponse.json(
      { ok: false, error: CONTENT_MISMATCH_ERROR },
      { status: 400 },
    );
  }

  const dogResult = await verifyDogLinkedToClientAccount(db, user.id, dogId);
  if (!dogResult.ok) {
    return NextResponse.json(
      { ok: false, error: dogResult.error },
      { status: dogResult.status },
    );
  }

  const extension = extensionForMimeType(detectedType);
  const timestamp = Date.now();
  const filePath = `${dogResult.dog.facility_id}/dogs/${dogId}/${documentType}-${timestamp}.${extension}`;

  const { error: uploadError } = await db.storage
    .from(VACCINATION_DOCUMENTS_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: detectedType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { ok: false, error: uploadError.message },
      { status: 500 },
    );
  }

  const { data: documentRow, error: insertError } = await db
    .from("dog_documents")
    .insert({
      dog_id: dogId,
      facility_id: dogResult.dog.facility_id,
      document_type: documentType,
      file_path: filePath,
      uploaded_by_client_account_id: user.id,
    })
    .select("*")
    .single();

  if (insertError || !documentRow) {
    await db.storage.from(VACCINATION_DOCUMENTS_BUCKET).remove([filePath]);
    return NextResponse.json(
      { ok: false, error: insertError?.message ?? "Failed to save document record" },
      { status: 500 },
    );
  }

  const response: UploadPortalDocumentSuccessResponse = {
    ok: true,
    document: mapDogDocumentRowToDogDocument(documentRow),
  };
  return NextResponse.json(response, { status: 201 });
}
