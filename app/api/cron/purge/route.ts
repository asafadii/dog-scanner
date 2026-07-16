import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  VACCINATION_DOCUMENTS_BUCKET,
  type DogDocumentRow,
  type DogRow,
  type ClientRow,
} from "@/lib/supabase/types";
import { NextResponse } from "next/server";

// Register at cron-job.org — run daily, e.g. 03:00 UTC
// GET https://hellodora.app/api/cron/purge
// Header: x-cron-secret: [your CRON_SECRET value]

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get("x-cron-secret") !== cronSecret
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const cutoff = new Date(Date.now() - NINETY_DAYS_MS).toISOString();

  const { data: archivedDogs, error: dogsError } = await db
    .from("dogs")
    .select("id")
    .lt("archived_at", cutoff)
    .not("archived_at", "is", null);

  if (dogsError) {
    return NextResponse.json({ error: dogsError.message }, { status: 500 });
  }

  const dogIds = ((archivedDogs ?? []) as Pick<DogRow, "id">[]).map(
    (row) => row.id,
  );
  let dogsDeleted = 0;

  for (const dogId of dogIds) {
    const { data: documents, error: docsError } = await db
      .from("dog_documents")
      .select("id, file_path")
      .eq("dog_id", dogId);

    if (docsError) {
      return NextResponse.json({ error: docsError.message }, { status: 500 });
    }

    const docs = (documents ?? []) as Pick<
      DogDocumentRow,
      "id" | "file_path"
    >[];
    const filePaths = docs.map((doc) => doc.file_path).filter(Boolean);

    if (filePaths.length > 0) {
      const { error: storageError } = await db.storage
        .from(VACCINATION_DOCUMENTS_BUCKET)
        .remove(filePaths);
      if (storageError) {
        console.error(
          "[purge] Failed to remove storage objects for dog",
          dogId,
          storageError.message,
        );
      }
    }

    if (docs.length > 0) {
      const { error: deleteDocsError } = await db
        .from("dog_documents")
        .delete()
        .eq("dog_id", dogId);
      if (deleteDocsError) {
        return NextResponse.json(
          { error: deleteDocsError.message },
          { status: 500 },
        );
      }
    }

    const { error: deleteDogError } = await db
      .from("dogs")
      .delete()
      .eq("id", dogId);

    if (deleteDogError) {
      return NextResponse.json(
        { error: deleteDogError.message },
        { status: 500 },
      );
    }

    dogsDeleted += 1;
  }

  const { data: archivedClients, error: clientsError } = await db
    .from("clients")
    .select("id")
    .lt("archived_at", cutoff)
    .not("archived_at", "is", null);

  if (clientsError) {
    return NextResponse.json({ error: clientsError.message }, { status: 500 });
  }

  const clientIds = ((archivedClients ?? []) as Pick<ClientRow, "id">[]).map(
    (row) => row.id,
  );
  let clientsDeleted = 0;

  for (const clientId of clientIds) {
    const { error: deleteClientError } = await db
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (deleteClientError) {
      return NextResponse.json(
        { error: deleteClientError.message },
        { status: 500 },
      );
    }

    clientsDeleted += 1;
  }

  return NextResponse.json({ dogsDeleted, clientsDeleted });
}
