import {
  detectFileSignature,
  DOCUMENT_ALLOWED_TYPES,
  DOCUMENT_MAX_BYTES,
  extensionForMimeType,
  mapDogDocumentRowToDogDocument,
  parseVaccinationExpiryDate,
  VACCINATION_EXPIRY_REQUIRED_MESSAGE,
  VACCINATION_NOTIFICATION_RESET,
} from "@/lib/portal/documents";
import { verifyStaffAccessToken } from "@/lib/staff/server";
import { VACCINATION_DOCUMENTS_BUCKET } from "@/lib/supabase/types";
import type { DogDocumentType } from "@/lib/types";
import { NextResponse } from "next/server";

const DOCUMENT_TYPES: DogDocumentType[] = ["vaccination", "pedigree", "other"];
const CONTENT_MISMATCH_ERROR =
  "File content does not match a supported format.";

export async function POST(request: Request) {
  const authResult = await verifyStaffAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { profile, db } = authResult.data;

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
  const documentType = String(
    formData.get("documentType") ?? "",
  ).trim() as DogDocumentType;
  const vaccinationExpiryDate = parseVaccinationExpiryDate(
    formData.get("vaccinationExpiryDate"),
  );
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

  if (documentType === "vaccination" && !vaccinationExpiryDate) {
    return NextResponse.json(
      { ok: false, error: VACCINATION_EXPIRY_REQUIRED_MESSAGE },
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
      {
        ok: false,
        error: "Unsupported format. Please use PDF, JPG, PNG, or WEBP.",
      },
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

  const { data: dog, error: dogError } = await db
    .from("dogs")
    .select("id, facility_id")
    .eq("id", dogId)
    .eq("facility_id", profile.facility_id)
    .maybeSingle();

  if (dogError || !dog) {
    return NextResponse.json(
      { ok: false, error: "Dog not found" },
      { status: 404 },
    );
  }

  const extension = extensionForMimeType(detectedType);
  const timestamp = Date.now();
  const filePath = `${dog.facility_id}/dogs/${dogId}/${documentType}-${timestamp}.${extension}`;

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
      facility_id: dog.facility_id,
      document_type: documentType,
      file_path: filePath,
      uploaded_by_client_account_id: null,
    })
    .select("*")
    .single();

  if (insertError || !documentRow) {
    await db.storage.from(VACCINATION_DOCUMENTS_BUCKET).remove([filePath]);
    return NextResponse.json(
      {
        ok: false,
        error: insertError?.message ?? "Failed to save document record",
      },
      { status: 500 },
    );
  }

  if (documentType === "vaccination" && vaccinationExpiryDate) {
    const { error: expiryError } = await db
      .from("dogs")
      .update({
        vaccination_expiry_date: vaccinationExpiryDate,
        ...VACCINATION_NOTIFICATION_RESET,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dogId)
      .eq("facility_id", dog.facility_id);

    if (expiryError) {
      return NextResponse.json(
        { ok: false, error: expiryError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { ok: true, document: mapDogDocumentRowToDogDocument(documentRow) },
    { status: 201 },
  );
}
