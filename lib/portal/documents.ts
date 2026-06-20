import { portalFetch } from "@/lib/portal/api";
import { requireClientAccount } from "@/lib/portal/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DogDocumentRow } from "@/lib/supabase/types";
import type { DogDocument, DogDocumentType } from "@/lib/types";

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type DetectedDocumentMimeType = (typeof DOCUMENT_ALLOWED_TYPES)[number];

export function detectFileSignature(
  buffer: Buffer,
): DetectedDocumentMimeType | null {
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export function extensionForMimeType(mimeType: DetectedDocumentMimeType): string {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export type DocumentValidationCode = "too_large" | "unsupported_format";

export type PortalDocumentsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "unknown";

export interface PortalDocumentsError {
  message: string;
  code: PortalDocumentsErrorCode;
}

type PortalDocumentsResult<T> =
  | { data: T; error: null }
  | { data: null; error: PortalDocumentsError };

function toError(
  message: string,
  code: PortalDocumentsErrorCode = "unknown",
): PortalDocumentsError {
  return { message, code };
}

export function mapDogDocumentRowToDogDocument(row: DogDocumentRow): DogDocument {
  return {
    id: row.id,
    dogId: row.dog_id,
    facilityId: row.facility_id,
    documentType: row.document_type,
    filePath: row.file_path,
    uploadedByClientAccountId: row.uploaded_by_client_account_id,
    createdAt: row.created_at,
  };
}

export function validateDocumentFile(
  file: File,
): { ok: true } | { ok: false; code: DocumentValidationCode } {
  if (
    !DOCUMENT_ALLOWED_TYPES.includes(
      file.type as (typeof DOCUMENT_ALLOWED_TYPES)[number],
    )
  ) {
    return { ok: false, code: "unsupported_format" };
  }

  if (file.size > DOCUMENT_MAX_BYTES) {
    return { ok: false, code: "too_large" };
  }

  return { ok: true };
}

export function getDocumentValidationMessage(
  code: DocumentValidationCode,
): string {
  switch (code) {
    case "too_large":
      return "File is too large. Please choose a file under 10 MB.";
    case "unsupported_format":
      return "Unsupported format. Please use PDF, JPG, PNG, or WEBP.";
  }
}

export interface UploadPortalDocumentSuccessResponse {
  ok: true;
  document: DogDocument;
}

export interface UploadPortalDocumentErrorResponse {
  ok: false;
  error: string;
}

export type UploadPortalDocumentResponse =
  | UploadPortalDocumentSuccessResponse
  | UploadPortalDocumentErrorResponse;

export async function uploadPortalDocument(
  dogId: string,
  file: File,
  documentType: DogDocumentType,
): Promise<PortalDocumentsResult<DogDocument>> {
  const validation = validateDocumentFile(file);
  if (!validation.ok) {
    return {
      data: null,
      error: toError(getDocumentValidationMessage(validation.code)),
    };
  }

  const formData = new FormData();
  formData.append("dogId", dogId);
  formData.append("documentType", documentType);
  formData.append("file", file);

  const response = await portalFetch("/api/portal/documents", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as UploadPortalDocumentResponse;

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to upload document";
    return {
      data: null,
      error: toError(message, response.status === 403 ? "unauthorized" : "unknown"),
    };
  }

  return { data: data.document, error: null };
}

export async function getDogDocuments(
  dogId: string,
): Promise<PortalDocumentsResult<DogDocument[]>> {
  const accountResult = await requireClientAccount();
  if (accountResult.error) {
    return { data: null, error: accountResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dog_documents")
    .select("*")
    .eq("dog_id", dogId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: (data as DogDocumentRow[]).map(mapDogDocumentRowToDogDocument),
    error: null,
  };
}

export async function getPortalDocumentUrl(
  documentId: string,
): Promise<PortalDocumentsResult<string>> {
  const response = await portalFetch(
    `/api/portal/documents/${documentId}/url`,
    { method: "GET" },
  );

  const data = (await response.json()) as
    | { ok: true; url: string }
    | { ok: false; error: string };

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data
        ? data.error
        : "Failed to get document URL";
    return {
      data: null,
      error: toError(message, response.status === 403 ? "unauthorized" : "unknown"),
    };
  }

  return { data: data.url, error: null };
}
