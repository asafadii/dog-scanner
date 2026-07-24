import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import { getFacilityNotificationRecipients } from "@/lib/bookings/server";
import {
  buildAccessBlockedHtml,
  buildTrialEndedGraceHtml,
  buildTrialEndingSoonHtml,
  formatEmailDate,
} from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Register at cron-job.org — run daily, e.g. 08:00 UTC
// GET https://hellodora.app/api/cron/trial-lifecycle
// Header: x-cron-secret: [your CRON_SECRET value]

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";
const BILLING_URL = `${APP_URL}/subscription`;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const GRACE_DAYS = 7;

function utcDatePlusDays(days: number): string {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + days,
    ),
  )
    .toISOString()
    .slice(0, 10);
}

type LifecycleFacility = {
  id: string;
  name: string | null;
  trial_ends_at: string | null;
  past_due_since: string | null;
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  let trialEndingSent = 0;
  let graceStartedSent = 0;
  let accessBlockedSent = 0;

  // Trigger A — trial ending in 7 days
  const trialTargetDate = utcDatePlusDays(7);
  const trialTargetNextDay = utcDatePlusDays(8);

  const { data: trialEndingFacilities, error: trialEndingError } = await db
    .from("facilities")
    .select("id, name, trial_ends_at, past_due_since")
    .eq("subscription_status", "trialing")
    .not("trial_ends_at", "is", null)
    .is("trial_7day_email_sent_at", null)
    .gte("trial_ends_at", `${trialTargetDate}T00:00:00.000Z`)
    .lt("trial_ends_at", `${trialTargetNextDay}T00:00:00.000Z`);

  if (trialEndingError) {
    console.error(
      "[cron/trial-lifecycle] trial ending query failed:",
      trialEndingError.message,
    );
  } else {
    for (const facility of (trialEndingFacilities ??
      []) as LifecycleFacility[]) {
      try {
        const facilityName = facility.name?.trim() || "your facility";
        const trialEndsAt = facility.trial_ends_at
          ? formatEmailDate(facility.trial_ends_at.slice(0, 10))
          : trialTargetDate;
        const recipients = await getFacilityNotificationRecipients(
          db,
          facility.id,
        );
        const html = buildTrialEndingSoonHtml({
          facilityName,
          trialEndsAt,
          billingUrl: BILLING_URL,
        });

        for (const email of recipients) {
          await sendTransactionalEmail({
            to: email,
            subject: "Your trial ends in 7 days",
            html,
          });
        }

        const { error: stampError } = await db
          .from("facilities")
          .update({ trial_7day_email_sent_at: new Date().toISOString() })
          .eq("id", facility.id);

        if (stampError) {
          console.error(
            "[cron/trial-lifecycle] trial_7day stamp failed:",
            stampError.message,
            { facilityId: facility.id },
          );
          continue;
        }

        trialEndingSent += 1;
      } catch (err) {
        console.error(
          "[cron/trial-lifecycle] trial ending failed:",
          err instanceof Error ? err.message : err,
          { facilityId: facility.id },
        );
      }
    }
  }

  // Trigger B — grace period just started
  const { data: graceFacilities, error: graceError } = await db
    .from("facilities")
    .select("id, name, trial_ends_at, past_due_since")
    .eq("subscription_status", "past_due")
    .not("past_due_since", "is", null)
    .is("grace_started_email_sent_at", null);

  if (graceError) {
    console.error(
      "[cron/trial-lifecycle] grace started query failed:",
      graceError.message,
    );
  } else {
    for (const facility of (graceFacilities ?? []) as LifecycleFacility[]) {
      try {
        if (!facility.past_due_since) continue;

        const daysSincePastDue = Math.floor(
          (Date.now() - new Date(facility.past_due_since).getTime()) /
            MS_PER_DAY,
        );
        const daysUntilBlocked = Math.max(0, GRACE_DAYS - daysSincePastDue);
        const facilityName = facility.name?.trim() || "your facility";
        const recipients = await getFacilityNotificationRecipients(
          db,
          facility.id,
        );
        const html = buildTrialEndedGraceHtml({
          facilityName,
          daysUntilBlocked,
          billingUrl: BILLING_URL,
        });

        for (const email of recipients) {
          await sendTransactionalEmail({
            to: email,
            subject: "We couldn't charge your card",
            html,
          });
        }

        const { error: stampError } = await db
          .from("facilities")
          .update({ grace_started_email_sent_at: new Date().toISOString() })
          .eq("id", facility.id);

        if (stampError) {
          console.error(
            "[cron/trial-lifecycle] grace_started stamp failed:",
            stampError.message,
            { facilityId: facility.id },
          );
          continue;
        }

        graceStartedSent += 1;
      } catch (err) {
        console.error(
          "[cron/trial-lifecycle] grace started failed:",
          err instanceof Error ? err.message : err,
          { facilityId: facility.id },
        );
      }
    }
  }

  // Trigger C — grace period expired (now blocked)
  const blockedCutoff = new Date(
    Date.now() - GRACE_DAYS * MS_PER_DAY,
  ).toISOString();

  const { data: blockedFacilities, error: blockedError } = await db
    .from("facilities")
    .select("id, name, trial_ends_at, past_due_since")
    .eq("subscription_status", "past_due")
    .not("past_due_since", "is", null)
    .lt("past_due_since", blockedCutoff)
    .is("access_blocked_email_sent_at", null);

  if (blockedError) {
    console.error(
      "[cron/trial-lifecycle] access blocked query failed:",
      blockedError.message,
    );
  } else {
    for (const facility of (blockedFacilities ?? []) as LifecycleFacility[]) {
      try {
        const facilityName = facility.name?.trim() || "your facility";
        const recipients = await getFacilityNotificationRecipients(
          db,
          facility.id,
        );
        const html = buildAccessBlockedHtml({
          facilityName,
          billingUrl: BILLING_URL,
        });

        for (const email of recipients) {
          await sendTransactionalEmail({
            to: email,
            subject: "Your account is paused",
            html,
          });
        }

        const { error: stampError } = await db
          .from("facilities")
          .update({ access_blocked_email_sent_at: new Date().toISOString() })
          .eq("id", facility.id);

        if (stampError) {
          console.error(
            "[cron/trial-lifecycle] access_blocked stamp failed:",
            stampError.message,
            { facilityId: facility.id },
          );
          continue;
        }

        accessBlockedSent += 1;
      } catch (err) {
        console.error(
          "[cron/trial-lifecycle] access blocked failed:",
          err instanceof Error ? err.message : err,
          { facilityId: facility.id },
        );
      }
    }
  }

  return NextResponse.json({
    data: {
      trialEndingSent,
      graceStartedSent,
      accessBlockedSent,
    },
  });
}
