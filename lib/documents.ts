import { staffFetch } from "@/lib/api";
import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import {
  getDocumentValidationMessage,
  mapDogDocumentRowToDogDocument,
  validateDocumentFile,
} from "@/lib/portal/documents";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DogDocumentRow, ProfileRow } from "@/lib/supabase/types";
import type { DogDocument, DogDocumentType } from "@/lib/types";

export type DocumentsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "unknown";

export interface DocumentsError {
  message: string;
  code: DocumentsErrorCode;
}

type DocumentsResult<T> =
  | { data: T; error: null }
  | { data: null; error: DocumentsError };

function toError(
  message: string,
  code: DocumentsErrorCode = "unknown",
): DocumentsError {
  return { message, code };
}

async function requireProfile(): Promise<DocumentsResult<ProfileRow>> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: toError("Not signed in", "unauthorized") };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { data: null, error: toError(profileError.message) };
  }

  if (!profile) {
    return {
      data: null,
      error: toError(INCOMPLETE_SETUP_MESSAGE, "incomplete_setup"),
    };
  }

  return { data: profile as ProfileRow, error: null };
}

export async function getStaffDogDocuments(
  dogId: string,
): Promise<DocumentsResult<DogDocument[]>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("dog_documents")
    .select("*")
    .eq("dog_id", dogId)
    .eq("facility_id", profileResult.data.facility_id)
    .eq("document_type", "vaccination")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return {
    data: (data as DogDocumentRow[]).map(mapDogDocumentRowToDogDocument),
    error: null,
  };
}

export async function uploadStaffDogDocument(
  dogId: string,
  file: File,
  documentType: DogDocumentType = "vaccination",
): Promise<DocumentsResult<DogDocument>> {
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

  const response = await staffFetch("/api/documents", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as
    | { ok: true; document: DogDocument }
    | { ok: false; error: string };

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data ? data.error : "Failed to upload document";
    return {
      data: null,
      error: toError(message, response.status === 403 ? "unauthorized" : "unknown"),
    };
  }

  return { data: data.document, error: null };
}

export async function deleteStaffDogDocument(
  documentId: string,
): Promise<DocumentsResult<null>> {
  const response = await staffFetch(`/api/documents/${documentId}`, {
    method: "DELETE",
  });

  const data = (await response.json()) as
    | { ok: true }
    | { ok: false; error: string };

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data ? data.error : "Failed to delete document";
    return {
      data: null,
      error: toError(message, response.status === 403 ? "unauthorized" : "unknown"),
    };
  }

  return { data: null, error: null };
}

export async function getStaffDocumentUrl(
  documentId: string,
): Promise<DocumentsResult<string>> {
  const response = await staffFetch(`/api/documents/${documentId}/url`, {
    method: "GET",
  });

  const data = (await response.json()) as
    | { ok: true; url: string }
    | { ok: false; error: string };

  if (!response.ok || !data.ok) {
    const message =
      !data.ok && "error" in data ? data.error : "Failed to get document URL";
    return {
      data: null,
      error: toError(message, response.status === 403 ? "unauthorized" : "unknown"),
    };
  }

  return { data: data.url, error: null };
}
