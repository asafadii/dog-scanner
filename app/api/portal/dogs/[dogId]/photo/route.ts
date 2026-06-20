import {
  verifyDogLinkedToClientAccount,
  verifyPortalAccessToken,
} from "@/lib/portal/server";
import {
  getDogPhotoValidationMessage,
  validateDogPhotoFile,
} from "@/lib/storage";
import { DOG_PHOTOS_BUCKET } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

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

export async function POST(
  request: Request,
  context: { params: Promise<{ dogId: string }> },
) {
  const authResult = await verifyPortalAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { ok: false, error: authResult.error },
      { status: authResult.status },
    );
  }

  const { user, db } = authResult.data;
  const { dogId } = await context.params;

  if (!dogId) {
    return NextResponse.json(
      { ok: false, error: "dogId is required" },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "File is required" },
      { status: 400 },
    );
  }

  const validation = validateDogPhotoFile(file);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: getDogPhotoValidationMessage(validation.code) },
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

  const extension = extensionForMimeType(file.type);
  const path = `${dogResult.dog.facility_id}/dogs/${dogId}.${extension}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await db.storage
    .from(DOG_PHOTOS_BUCKET)
    .upload(path, fileBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { ok: false, error: uploadError.message },
      { status: 500 },
    );
  }

  const { data: publicUrlData } = db.storage
    .from(DOG_PHOTOS_BUCKET)
    .getPublicUrl(path);
  const photoUrl = publicUrlData.publicUrl;

  const { error: updateError } = await db
    .from("dogs")
    .update({ photo_url: photoUrl })
    .eq("id", dogId)
    .eq("facility_id", dogResult.dog.facility_id);

  if (updateError) {
    await db.storage.from(DOG_PHOTOS_BUCKET).remove([path]);
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, photoUrl }, { status: 201 });
}
