import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DOG_PHOTOS_BUCKET } from "@/lib/supabase/types";

export interface UploadDogPhotoResult {
  path: string;
  bucket: typeof DOG_PHOTOS_BUCKET;
}

export async function uploadDogPhoto(
  dogId: string,
  file: File,
): Promise<UploadDogPhotoResult> {
  const supabase = createSupabaseBrowserClient();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${dogId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(DOG_PHOTOS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload dog photo: ${error.message}`);
  }

  return { path, bucket: DOG_PHOTOS_BUCKET };
}

export function getDogPhotoUrl(path: string): string {
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase.storage.from(DOG_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
