import { APP_URL, STRIPE_PRICES, stripe } from "@/lib/stripe/server";
import { verifyStaffAccessToken } from "@/lib/staff/server";
import type { FacilityRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

interface CheckoutBody {
  plan?: "dora" | "dora_unlimited";
}

export async function POST(request: Request) {
  const authResult = await verifyStaffAccessToken(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  const { profile, db } = authResult.data;

  if (profile.role !== "admin") {
    return NextResponse.json(
      { error: "Only facility admins can manage billing." },
      { status: 403 },
    );
  }

  let body: CheckoutBody = {};
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = body.plan;
  if (plan !== "dora" && plan !== "dora_unlimited") {
    return NextResponse.json(
      { error: "plan must be 'dora' or 'dora_unlimited'" },
      { status: 400 },
    );
  }

  const { data: facility, error: facilityError } = await db
    .from("facilities")
    .select("*")
    .eq("id", profile.facility_id)
    .maybeSingle();

  if (facilityError) {
    return NextResponse.json({ error: facilityError.message }, { status: 500 });
  }

  if (!facility) {
    return NextResponse.json({ error: "Facility not found" }, { status: 404 });
  }

  const facilityRow = facility as FacilityRow;
  let stripeCustomerId = facilityRow.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      name: profile.full_name,
      metadata: {
        facility_id: profile.facility_id,
        profile_id: profile.id,
      },
    });

    stripeCustomerId = customer.id;

    const { error: updateError } = await db
      .from("facilities")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", profile.facility_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
    },
    success_url: `${APP_URL}/subscription?success=true`,
    cancel_url: `${APP_URL}/subscription`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}
