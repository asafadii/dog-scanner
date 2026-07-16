import { APP_URL, stripe } from "@/lib/stripe/server";
import { verifyStaffAccessToken } from "@/lib/staff/server";
import type { FacilityRow } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

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

  const { data: facility, error: facilityError } = await db
    .from("facilities")
    .select("stripe_customer_id")
    .eq("id", profile.facility_id)
    .maybeSingle();

  if (facilityError) {
    return NextResponse.json({ error: facilityError.message }, { status: 500 });
  }

  const stripeCustomerId = (facility as Pick<
    FacilityRow,
    "stripe_customer_id"
  > | null)?.stripe_customer_id;

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 400 },
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${APP_URL}/subscription`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}
