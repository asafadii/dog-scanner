// WEBHOOK_SECRET: register at https://dashboard.stripe.com/webhooks after deploying
// URL: https://hellodora.app/api/stripe/webhook
// Events: customer.subscription.created, customer.subscription.updated,
//         customer.subscription.deleted, invoice.payment_failed,
//         invoice.payment_succeeded

import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import { getFacilityNotificationRecipients } from "@/lib/bookings/server";
import { buildPaymentConfirmedHtml } from "@/lib/email";
import {
  facilityUpdateFromSubscription,
  updateFacilityByStripeCustomerId,
} from "@/lib/stripe/sync";
import { stripe } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";
const BILLING_URL = `${APP_URL}/subscription`;

function getStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if ("deleted" in customer && customer.deleted) return null;
  return customer.id;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = getStripeCustomerId(subscription.customer);
      if (!customerId) break;

      const update = facilityUpdateFromSubscription(subscription);
      if (!update) break;

      const result = await updateFacilityByStripeCustomerId(
        db,
        customerId,
        update,
      );
      if (!result.ok) {
        console.error("[stripe/webhook] facility update failed:", result.error);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = getStripeCustomerId(subscription.customer);
      if (!customerId) break;

      const result = await updateFacilityByStripeCustomerId(db, customerId, {
        subscription_status: "canceled",
        stripe_subscription_id: null,
      });
      if (!result.ok) {
        console.error("[stripe/webhook] facility update failed:", result.error);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getStripeCustomerId(invoice.customer);
      if (!customerId) break;

      const result = await updateFacilityByStripeCustomerId(db, customerId, {
        subscription_status: "past_due",
        past_due_since: new Date().toISOString(),
      });
      if (!result.ok) {
        console.error("[stripe/webhook] facility update failed:", result.error);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getStripeCustomerId(invoice.customer);
      if (!customerId) break;

      const result = await updateFacilityByStripeCustomerId(db, customerId, {
        subscription_status: "active",
        past_due_since: null,
        grace_started_email_sent_at: null,
        access_blocked_email_sent_at: null,
      });
      if (!result.ok) {
        console.error("[stripe/webhook] facility update failed:", result.error);
        break;
      }

      try {
        const { data: facility, error: facilityError } = await db
          .from("facilities")
          .select("id, name")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (facilityError) {
          console.error(
            "[stripe/webhook] payment confirmed facility lookup failed:",
            facilityError.message,
          );
          break;
        }

        if (!facility) break;

        const facilityRow = facility as { id: string; name: string | null };
        const facilityName = facilityRow.name?.trim() || "your facility";
        const recipients = await getFacilityNotificationRecipients(
          db,
          facilityRow.id,
        );
        const html = buildPaymentConfirmedHtml({
          facilityName,
          billingUrl: BILLING_URL,
        });

        for (const email of recipients) {
          await sendTransactionalEmail({
            to: email,
            subject: "You're all set!",
            html,
          });
        }
      } catch (err) {
        console.error(
          "[stripe/webhook] payment confirmed email failed:",
          err instanceof Error ? err.message : err,
        );
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
