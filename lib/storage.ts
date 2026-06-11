import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DOG_PHOTOS_BUCKET } from "@/lib/supabase/types";

export const DOG_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const DOG_PHOTO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type DogPhotoValidationCode = "too_large" | "unsupported_format";

export interface UploadDogPhotoResult {
  path: string;
  publicUrl: string;
  bucket: typeof DOG_PHOTOS_BUCKET;
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function validateDogPhotoFile(
  file: File,
): { ok: true } | { ok: false; code: DogPhotoValidationCode } {
  if (!DOG_PHOTO_ALLOWED_TYPES.includes(
    file.type as (typeof DOG_PHOTO_ALLOWED_TYPES)[number],
  )) {
    return { ok: false, code: "unsupported_format" };
  }

  if (file.size > DOG_PHOTO_MAX_BYTES) {
    return { ok: false, code: "too_large" };
  }

  return { ok: true };
}

export function getDogPhotoValidationMessage(
  code: DogPhotoValidationCode,
): string {
  switch (code) {
    case "too_large":
      return "File is too large. Please choose an image under 10 MB.";
    case "unsupported_format":
      return "Unsupported format. Please use JPG, PNG, or WEBP.";
  }
}

export async function uploadDogPhoto(
  facilityId: string,
  file: File,
  dogId?: string,
): Promise<UploadDogPhotoResult> {
  const validation = validateDogPhotoFile(file);
  if (!validation.ok) {
    throw new Error(getDogPhotoValidationMessage(validation.code));
  }

  const supabase = createSupabaseBrowserClient();
  const extension = extensionForMimeType(file.type);
  const fileKey = dogId ?? String(Date.now());
  const path = `${facilityId}/dogs/${fileKey}.${extension}`;

  const { error } = await supabase.storage
    .from(DOG_PHOTOS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: Boolean(dogId),
    });

  if (error) {
    throw new Error("Upload failed. Please try again.");
  }

  return {
    path,
    publicUrl: getDogPhotoUrl(path),
    bucket: DOG_PHOTOS_BUCKET,
  };
}

export function getDogPhotoUrl(path: string): string {
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase.storage.from(DOG_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
