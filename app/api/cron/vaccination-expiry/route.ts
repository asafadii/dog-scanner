import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import { getFacilityNotificationRecipients } from "@/lib/bookings/server";
import {
  buildVaccinationExpiredFacilityHtml,
  buildVaccinationExpiredOwnerHtml,
  buildVaccinationExpiringFacilityHtml,
  buildVaccinationExpiringOwnerHtml,
  formatEmailDate,
} from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  ClientAccountRow,
  ClientRow,
  DogRow,
  FacilityRow,
} from "@/lib/supabase/types";
import { NextResponse } from "next/server";

// Required Netlify env: CRON_SECRET
// Register at cron-job.org to hit this endpoint daily at 08:00 UTC
// with header x-cron-secret: [your secret]

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

function utcDateString(daysFromToday: number): string {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysFromToday,
    ),
  )
    .toISOString()
    .slice(0, 10);
}

type AdminDb = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

type VaccinationDog = Pick<
  DogRow,
  | "id"
  | "facility_id"
  | "client_id"
  | "name"
  | "owner_name"
  | "vaccination_expiry_date"
  | "vaccination_owner_week_before_email_sent_at"
  | "vaccination_owner_expired_email_sent_at"
  | "vaccination_facility_week_before_email_sent_at"
  | "vaccination_facility_expired_email_sent_at"
>;

type PassKind = "week_before" | "expired";

const PASS_COLUMNS: Record<
  PassKind,
  {
    ownerSentAt: keyof VaccinationDog;
    facilitySentAt: keyof VaccinationDog;
  }
> = {
  week_before: {
    ownerSentAt: "vaccination_owner_week_before_email_sent_at",
    facilitySentAt: "vaccination_facility_week_before_email_sent_at",
  },
  expired: {
    ownerSentAt: "vaccination_owner_expired_email_sent_at",
    facilitySentAt: "vaccination_facility_expired_email_sent_at",
  },
};

type Summary = {
  ownerWeekBeforeSent: number;
  facilityWeekBeforeSent: number;
  ownerExpiredSent: number;
  facilityExpiredSent: number;
  skippedOptOut: number;
  skippedNoClient: number;
};

async function stampSentAt(
  db: AdminDb,
  dog: VaccinationDog,
  column: keyof VaccinationDog,
): Promise<void> {
  const { error } = await db
    .from("dogs")
    .update({ [column]: new Date().toISOString() })
    .eq("id", dog.id)
    .eq("facility_id", dog.facility_id);

  if (error) {
    console.error(
      "[cron/vaccination-expiry] sent-at stamp failed:",
      error.message,
      { dogId: dog.id, column },
    );
  }
}

async function processDog(
  db: AdminDb,
  dog: VaccinationDog,
  kind: PassKind,
  summary: Summary,
): Promise<void> {
  const columns = PASS_COLUMNS[kind];
  const ownerAlreadySent = Boolean(dog[columns.ownerSentAt]);
  const facilityAlreadySent = Boolean(dog[columns.facilitySentAt]);

  const [clientResult, facilityResult, linkResult] = await Promise.all([
    dog.client_id
      ? db
          .from("clients")
          .select("name, email")
          .eq("id", dog.client_id)
          .eq("facility_id", dog.facility_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    db
      .from("facilities")
      .select("name")
      .eq("id", dog.facility_id)
      .maybeSingle(),
    dog.client_id
      ? db
          .from("client_account_links")
          .select("client_account_id")
          .eq("client_id", dog.client_id)
          .eq("facility_id", dog.facility_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const client = clientResult.data as Pick<ClientRow, "name" | "email"> | null;
  const facility = facilityResult.data as Pick<FacilityRow, "name"> | null;
  const link = linkResult.data as { client_account_id: string } | null;
  const facilityName = facility?.name ?? "your daycare";
  const expiryDate = formatEmailDate(
    dog.vaccination_expiry_date ?? utcDateString(kind === "expired" ? 0 : 7),
  );
  const clientName = client?.name?.trim() || dog.owner_name;

  if (!ownerAlreadySent) {
    if (!dog.client_id || !client) {
      summary.skippedNoClient += 1;
    } else {
      let optedOut = false;

      if (link?.client_account_id) {
        const { data: account } = await db
          .from("client_accounts")
          .select("email_reminders_enabled, archived_at")
          .eq("id", link.client_account_id)
          .maybeSingle();

        const prefs = account as Pick<
          ClientAccountRow,
          "email_reminders_enabled" | "archived_at"
        > | null;

        if (
          prefs &&
          !prefs.archived_at &&
          prefs.email_reminders_enabled === false
        ) {
          optedOut = true;
          summary.skippedOptOut += 1;
        }
      }

      const ownerEmail = client.email?.trim();
      if (!optedOut && ownerEmail) {
        const uploadUrl = `${APP_URL}/portal/dogs/${dog.id}`;
        if (kind === "week_before") {
          await sendTransactionalEmail({
            to: ownerEmail,
            subject: `${dog.name}'s vaccination stamp expires in a week 🐾`,
            html: buildVaccinationExpiringOwnerHtml({
              clientName,
              dogName: dog.name,
              facilityName,
              expiryDate,
              uploadUrl,
            }),
          });
          summary.ownerWeekBeforeSent += 1;
        } else {
          await sendTransactionalEmail({
            to: ownerEmail,
            subject: `${dog.name}'s vaccination stamp has expired`,
            html: buildVaccinationExpiredOwnerHtml({
              clientName,
              dogName: dog.name,
              facilityName,
              expiryDate,
              uploadUrl,
            }),
          });
          summary.ownerExpiredSent += 1;
        }
        await stampSentAt(db, dog, columns.ownerSentAt);
      }
    }
  }

  if (facilityAlreadySent) {
    return;
  }

  const recipients = await getFacilityNotificationRecipients(
    db,
    dog.facility_id,
  );
  if (recipients.length === 0) {
    return;
  }

  const dogUrl = `${APP_URL}/dogs/${dog.id}`;
  const facilityHtml =
    kind === "week_before"
      ? buildVaccinationExpiringFacilityHtml({
          dogName: dog.name,
          clientName,
          expiryDate,
          dogUrl,
        })
      : buildVaccinationExpiredFacilityHtml({
          dogName: dog.name,
          clientName,
          expiryDate,
          dogUrl,
        });
  const facilitySubject =
    kind === "week_before"
      ? `Vaccination expiring soon for ${dog.name}`
      : `Vaccination expired for ${dog.name}`;

  for (const email of recipients) {
    await sendTransactionalEmail({
      to: email,
      subject: facilitySubject,
      html: facilityHtml,
    });
  }

  if (kind === "week_before") {
    summary.facilityWeekBeforeSent += recipients.length;
  } else {
    summary.facilityExpiredSent += recipients.length;
  }

  await stampSentAt(db, dog, columns.facilitySentAt);
}

async function runPass(
  db: AdminDb,
  kind: PassKind,
  expiryDate: string,
  summary: Summary,
): Promise<string | null> {
  const columns = PASS_COLUMNS[kind];
  const { data: dogs, error } = await db
    .from("dogs")
    .select(
      "id, facility_id, client_id, name, owner_name, vaccination_expiry_date, vaccination_owner_week_before_email_sent_at, vaccination_owner_expired_email_sent_at, vaccination_facility_week_before_email_sent_at, vaccination_facility_expired_email_sent_at",
    )
    .eq("vaccination_expiry_date", expiryDate)
    .or(`${columns.ownerSentAt}.is.null,${columns.facilitySentAt}.is.null`)
    .is("archived_at", null);

  if (error) {
    return error.message;
  }

  for (const row of (dogs ?? []) as VaccinationDog[]) {
    await processDog(db, row, kind, summary);
  }

  return null;
}

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

  const today = utcDateString(0);
  const inOneWeek = utcDateString(7);

  const summary: Summary = {
    ownerWeekBeforeSent: 0,
    facilityWeekBeforeSent: 0,
    ownerExpiredSent: 0,
    facilityExpiredSent: 0,
    skippedOptOut: 0,
    skippedNoClient: 0,
  };

  const weekBeforeError = await runPass(db, "week_before", inOneWeek, summary);
  if (weekBeforeError) {
    return NextResponse.json({ error: weekBeforeError }, { status: 500 });
  }

  const expiredError = await runPass(db, "expired", today, summary);
  if (expiredError) {
    return NextResponse.json({ error: expiredError }, { status: 500 });
  }

  return NextResponse.json(summary);
}
