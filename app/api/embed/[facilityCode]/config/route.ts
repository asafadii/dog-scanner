import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { BookingFormConfig } from "@/lib/types";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ facilityCode: string }>;
}

function isBookingFormConfig(value: unknown): value is BookingFormConfig {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const states = new Set(["hidden", "optional", "required"]);
  return Object.values(value as Record<string, unknown>).every(
    (state) => typeof state === "string" && states.has(state),
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { facilityCode: rawCode } = await context.params;
  const facilityCode = rawCode?.trim();

  if (!facilityCode) {
    return NextResponse.json({ error: "Facility not found" }, { status: 404 });
  }

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const { data, error } = await db
    .from("facilities")
    .select("id, name, booking_form_config")
    .ilike("facility_code", facilityCode)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Facility not found" }, { status: 404 });
  }

  const row = data as {
    id: string;
    name: string | null;
    booking_form_config: unknown;
  };

  const bookingFormConfig = isBookingFormConfig(row.booking_form_config)
    ? row.booking_form_config
    : {};

  return NextResponse.json({
    data: {
      facilityName: row.name ?? "Dog daycare",
      bookingFormConfig,
      facilityId: row.id,
    },
  });
}
