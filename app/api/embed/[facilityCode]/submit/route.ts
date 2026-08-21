import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import { getFacilityAccessLevelServer } from "@/lib/billing/access";
import {
  createBookingServer,
  getFacilityNotificationPreferences,
  getFacilityNotificationRecipients,
} from "@/lib/bookings/server";
import { toDogInsert } from "@/lib/dogs";
import {
  buildBookingCongratulationsHtml,
  buildFacilityNewBookingRequestHtml,
  buildNewBookingAddedHtml,
  formatEmailDate,
} from "@/lib/email";
import {
  checkEmbedRateLimit,
  recordEmbedAttempt,
} from "@/lib/embedBooking/rateLimit";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  BookingFormConfig,
  BookingFormFieldState,
  DogSize,
  FeedingSource,
  NewDogFormData,
} from "@/lib/types";
import {
  BOOKING_FORM_FIELD_GROUPS,
  LOCKED_BOOKING_FORM_FIELDS,
} from "@/lib/types";
import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

type ServerDb = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

interface RouteContext {
  params: Promise<{ facilityCode: string }>;
}

const CONFIGURABLE_KEYS = new Set(
  BOOKING_FORM_FIELD_GROUPS.flatMap((group) =>
    group.fields.map((field) => field.key),
  ),
);

function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
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

function fieldState(
  config: BookingFormConfig,
  key: string,
): BookingFormFieldState {
  if (
    (LOCKED_BOOKING_FORM_FIELDS as readonly string[]).includes(key)
  ) {
    return "required";
  }
  return config[key] ?? "optional";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asTriState(value: unknown): boolean | null {
  if (value === true || value === false || value === null) return value;
  return null;
}

function asDogSize(value: unknown): DogSize | null {
  if (value === "small" || value === "medium" || value === "large") {
    return value;
  }
  return null;
}

function asFeedingSource(value: unknown): FeedingSource | null {
  if (value === "own" || value === "facility") return value;
  return null;
}

function asMeals(value: unknown): 1 | 2 | 3 | null {
  if (value === 1 || value === 2 || value === 3) return value;
  if (value === "1" || value === "2" || value === "3") {
    return Number(value) as 1 | 2 | 3;
  }
  return null;
}

function validateRequiredFields(
  body: Record<string, unknown>,
  config: BookingFormConfig,
): string | null {
  const name = asString(body.name);
  const ownerName = asString(body.ownerName);
  const ownerEmail = asString(body.ownerEmail);
  const aggressionPeople = asTriState(body.aggressionTowardsPeople);
  const aggressionDogs = asTriState(body.aggressionTowardsDogs);

  if (!name) return "Dog name is required";
  if (!ownerName) return "Owner name is required";
  if (!ownerEmail || !ownerEmail.includes("@")) {
    return "A valid owner email is required";
  }
  if (aggressionPeople !== true && aggressionPeople !== false) {
    return "Aggression towards people is required";
  }
  if (aggressionDogs !== true && aggressionDogs !== false) {
    return "Aggression towards dogs is required";
  }

  for (const key of CONFIGURABLE_KEYS) {
    if (fieldState(config, key) !== "required") continue;

    switch (key) {
      case "breed":
      case "age":
      case "microchipNumber":
      case "healthCertificateNumber":
      case "ownerPhone":
      case "ownerAddress":
      case "ownerEmergencyContact":
      case "ownerEmergencyPhone":
      case "ownerNotes":
      case "feedingNotes":
      case "behavior":
        if (!asString(body[key])) {
          return `${key} is required`;
        }
        break;
      case "size":
        if (!asDogSize(body.size)) return "Size is required";
        break;
      case "isNeutered":
      case "separationAnxiety":
      case "chewingRisk":
      case "kennelTrained":
        if (asTriState(body[key]) !== true && asTriState(body[key]) !== false) {
          return `${key} is required`;
        }
        break;
      case "feedingSource":
        if (!asFeedingSource(body.feedingSource)) {
          return "Food source is required";
        }
        break;
      case "feedingMealsPerDay":
        if (!asMeals(body.feedingMealsPerDay)) {
          return "Meals per day is required";
        }
        break;
      default:
        break;
    }
  }

  const serviceType = body.serviceType;
  const startDate = asString(body.startDate);
  const endDate = asString(body.endDate);

  if (serviceType !== "daycare" && serviceType !== "boarding") {
    return "Service type is required";
  }
  if (!startDate || !endDate) return "Start and end dates are required";
  if (endDate < startDate) {
    return "End date must be on or after start date";
  }

  return null;
}

function buildDogFormData(
  body: Record<string, unknown>,
  clientId: string,
): NewDogFormData {
  const feedingSource = asFeedingSource(body.feedingSource);
  const meals = asMeals(body.feedingMealsPerDay) ?? 2;

  return {
    name: asString(body.name),
    breed: asString(body.breed) || "Unknown",
    age: asString(body.age) || "Unknown",
    size: asDogSize(body.size) ?? "medium",
    gender: null,
    clientId,
    ownerName: asString(body.ownerName),
    ownerPhone: asString(body.ownerPhone),
    ownerEmail: asString(body.ownerEmail).toLowerCase(),
    ownerAddress: asString(body.ownerAddress),
    ownerEmergencyContact: asString(body.ownerEmergencyContact),
    ownerEmergencyPhone: asString(body.ownerEmergencyPhone),
    ownerNotes: asString(body.ownerNotes),
    microchipNumber: asString(body.microchipNumber),
    isNeutered: asTriState(body.isNeutered),
    healthCertificateNumber: asString(body.healthCertificateNumber),
    vaccinationExpiryDate: "",
    aggressionTowardsPeople: asTriState(body.aggressionTowardsPeople),
    aggressionTowardsDogs: asTriState(body.aggressionTowardsDogs),
    separationAnxiety: asTriState(body.separationAnxiety),
    kennelTrained: asTriState(body.kennelTrained),
    chewingRisk: asTriState(body.chewingRisk),
    separationAnxietyNotes: "",
    kennelTrainedNotes: "",
    chewingRiskNotes: "",
    aggressionPeopleNotes: "",
    aggressionDogsNotes: "",
    medicationNotes: "",
    allergyNotes: "",
    dietaryNotes: "",
    feedingSource,
    feedingMealsPerDay: meals,
    feedingNotes: asString(body.feedingNotes),
    behavior: asString(body.behavior),
    alerts: {
      medication: false,
      allergy: false,
      dietary: false,
      aggressionTowardsPeople: body.aggressionTowardsPeople === true,
      aggressionTowardsDogs: body.aggressionTowardsDogs === true,
      chewingRisk: false,
      escapeRisk: false,
    },
  };
}

async function ensureClientLink(
  db: ServerDb,
  clientAccountId: string,
  facilityId: string,
  ownerName: string,
  ownerEmail: string,
  ownerPhone: string,
): Promise<{ clientId: string } | { error: string }> {
  const { data: existingLink, error: linkError } = await db
    .from("client_account_links")
    .select("client_id")
    .eq("client_account_id", clientAccountId)
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (linkError) {
    return { error: linkError.message };
  }

  if (existingLink?.client_id) {
    return { clientId: existingLink.client_id as string };
  }

  const { data: existingClient, error: existingClientError } = await db
    .from("clients")
    .select("id")
    .eq("facility_id", facilityId)
    .ilike("email", ownerEmail)
    .is("archived_at", null)
    .maybeSingle();

  if (existingClientError) {
    return { error: existingClientError.message };
  }

  let clientId = existingClient?.id as string | undefined;

  if (!clientId) {
    const { data: createdClient, error: createError } = await db
      .from("clients")
      .insert({
        facility_id: facilityId,
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone || "",
      })
      .select("id")
      .single();

    if (createError || !createdClient) {
      return {
        error: createError?.message ?? "Failed to create client record",
      };
    }

    clientId = createdClient.id as string;
  }

  const { error: insertLinkError } = await db
    .from("client_account_links")
    .insert({
      client_account_id: clientAccountId,
      client_id: clientId,
      facility_id: facilityId,
    });

  if (insertLinkError && insertLinkError.code !== "23505") {
    return { error: insertLinkError.message };
  }

  return { clientId };
}

async function findOrCreateDog(
  db: ServerDb,
  facilityId: string,
  clientId: string,
  form: NewDogFormData,
): Promise<{ dogId: string } | { error: string }> {
  const { data: existingDog, error: dogLookupError } = await db
    .from("dogs")
    .select("id")
    .eq("facility_id", facilityId)
    .eq("client_id", clientId)
    .ilike("name", form.name)
    .is("archived_at", null)
    .maybeSingle();

  if (dogLookupError) {
    return { error: dogLookupError.message };
  }

  if (existingDog?.id) {
    return { dogId: existingDog.id as string };
  }

  const insertRow = toDogInsert(facilityId, form);
  const { data: createdDog, error: createDogError } = await db
    .from("dogs")
    .insert(insertRow)
    .select("id")
    .single();

  if (createDogError || !createdDog) {
    return {
      error: createDogError?.message ?? "Failed to create dog record",
    };
  }

  return { dogId: createdDog.id as string };
}

export async function POST(request: Request, context: RouteContext) {
  const { facilityCode: rawCode } = await context.params;
  const facilityCode = rawCode?.trim();
  const ipAddress = extractClientIp(request);

  const db = createSupabaseAdminClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Server configuration error" },
      { status: 500 },
    );
  }

  const rate = await checkEmbedRateLimit(db, ipAddress);
  if (!rate.allowed) {
    await recordEmbedAttempt(db, ipAddress, null, false);
    return NextResponse.json(
      { ok: false, error: rate.error ?? "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  if (!facilityCode) {
    await recordEmbedAttempt(db, ipAddress, null, false);
    return NextResponse.json(
      { ok: false, error: "Facility not found" },
      { status: 404 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    await recordEmbedAttempt(db, ipAddress, null, false);
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { data: facility, error: facilityError } = await db
    .from("facilities")
    .select("id, name, booking_form_config")
    .ilike("facility_code", facilityCode)
    .maybeSingle();

  if (facilityError) {
    await recordEmbedAttempt(db, ipAddress, null, false);
    return NextResponse.json(
      { ok: false, error: facilityError.message },
      { status: 500 },
    );
  }

  if (!facility) {
    await recordEmbedAttempt(db, ipAddress, null, false);
    return NextResponse.json(
      { ok: false, error: "Facility not found" },
      { status: 404 },
    );
  }

  const facilityRow = facility as {
    id: string;
    name: string | null;
    booking_form_config: unknown;
  };
  const facilityId = facilityRow.id;
  const facilityName = facilityRow.name ?? "your daycare";
  const config = isBookingFormConfig(facilityRow.booking_form_config)
    ? facilityRow.booking_form_config
    : {};

  const access = await getFacilityAccessLevelServer(db, facilityId);
  if (access.level === "blocked") {
    await recordEmbedAttempt(db, ipAddress, facilityId, false);
    return NextResponse.json(
      {
        error: "This facility is not currently accepting new bookings.",
      },
      { status: 503 },
    );
  }

  const validationError = validateRequiredFields(body, config);
  if (validationError) {
    await recordEmbedAttempt(db, ipAddress, facilityId, false);
    return NextResponse.json(
      { ok: false, error: validationError },
      { status: 400 },
    );
  }

  const ownerEmail = asString(body.ownerEmail).toLowerCase();
  const ownerName = asString(body.ownerName);
  const ownerPhone = asString(body.ownerPhone);
  const dogName = asString(body.name);
  const serviceType = body.serviceType as "daycare" | "boarding";
  const startDate = asString(body.startDate);
  const endDate = asString(body.endDate);
  const transportRequired = Boolean(body.transportRequired);

  try {
    const { data: existingAccount } = await db
      .from("client_accounts")
      .select("id, email, full_name")
      .ilike("email", ownerEmail)
      .maybeSingle();

    let clientId: string;
    let dogId: string;
    let pendingAccountLink: boolean;
    let isExistingOwner: boolean;

    if (existingAccount) {
      isExistingOwner = true;
      pendingAccountLink = false;

      const linked = await ensureClientLink(
        db,
        existingAccount.id as string,
        facilityId,
        ownerName,
        ownerEmail,
        ownerPhone,
      );

      if ("error" in linked) {
        console.error("[embed submit] client link failed:", linked.error);
        await recordEmbedAttempt(db, ipAddress, facilityId, false);
        return NextResponse.json(
          { ok: false, error: linked.error },
          { status: 500 },
        );
      }

      clientId = linked.clientId;
      const form = buildDogFormData(body, clientId);
      const dogResult = await findOrCreateDog(db, facilityId, clientId, form);

      if ("error" in dogResult) {
        console.error("[embed submit] dog create failed:", dogResult.error);
        await recordEmbedAttempt(db, ipAddress, facilityId, false);
        return NextResponse.json(
          { ok: false, error: dogResult.error },
          { status: 500 },
        );
      }

      dogId = dogResult.dogId;
    } else {
      // New owner: create facility client + dog + booking flagged for later
      // account linking. Follow-up: when they sign up, auto-detect matching
      // clients by email and attach client_account_links (not in this sprint).
      isExistingOwner = false;
      pendingAccountLink = true;

      const { data: createdClient, error: createClientError } = await db
        .from("clients")
        .insert({
          facility_id: facilityId,
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone || "",
          address: asString(body.ownerAddress) || null,
          emergency_contact: asString(body.ownerEmergencyContact) || null,
          emergency_phone: asString(body.ownerEmergencyPhone) || null,
          notes: asString(body.ownerNotes) || null,
        })
        .select("id")
        .single();

      if (createClientError || !createdClient) {
        console.error(
          "[embed submit] client create failed:",
          createClientError?.message,
        );
        await recordEmbedAttempt(db, ipAddress, facilityId, false);
        return NextResponse.json(
          {
            ok: false,
            error: createClientError?.message ?? "Failed to create client",
          },
          { status: 500 },
        );
      }

      clientId = createdClient.id as string;
      const form = buildDogFormData(body, clientId);
      const insertRow = toDogInsert(facilityId, form);
      const { data: createdDog, error: createDogError } = await db
        .from("dogs")
        .insert(insertRow)
        .select("id")
        .single();

      if (createDogError || !createdDog) {
        console.error(
          "[embed submit] dog create failed after client create:",
          createDogError?.message,
          { clientId },
        );
        await recordEmbedAttempt(db, ipAddress, facilityId, false);
        return NextResponse.json(
          {
            ok: false,
            error: createDogError?.message ?? "Failed to create dog",
          },
          { status: 500 },
        );
      }

      dogId = createdDog.id as string;
    }

    const bookingResult = await createBookingServer(
      db,
      facilityId,
      {
        clientId,
        dogId,
        serviceType,
        startDate,
        endDate,
        transportRequired,
        foodSource: asFeedingSource(body.feedingSource) ?? "facility",
        notes: "",
      },
      { pendingAccountLink },
    );

    if (bookingResult.error || !bookingResult.data) {
      console.error(
        "[embed submit] booking create failed after client/dog:",
        bookingResult.error,
        { clientId, dogId },
      );
      await recordEmbedAttempt(db, ipAddress, facilityId, false);
      return NextResponse.json(
        {
          ok: false,
          error: bookingResult.error ?? "Failed to create booking",
        },
        { status: 500 },
      );
    }

    const booking = bookingResult.data;

    if (isExistingOwner) {
      await sendTransactionalEmail({
        to: ownerEmail,
        subject: `New booking added for ${dogName}`,
        html: buildNewBookingAddedHtml({
          clientName: ownerName,
          dogName,
          facilityName,
          portalUrl: `${APP_URL}/portal/bookings/${booking.id}`,
        }),
      });
    } else {
      await sendTransactionalEmail({
        to: ownerEmail,
        subject: `Finish setting up your hello DORA account 🎉`,
        html: buildBookingCongratulationsHtml({
          clientName: ownerName,
          dogName,
          facilityName,
          signupUrl: `${APP_URL}/portal/signup?email=${encodeURIComponent(ownerEmail)}`,
        }),
      });
    }

    const adminEmails = await getFacilityNotificationRecipients(db, facilityId);
    const prefs = await getFacilityNotificationPreferences(db, facilityId);
    if (adminEmails.length > 0 && prefs.notifyNewBooking) {
      const bookingUrl = `${APP_URL}/bookings/${booking.id}`;
      const html = buildFacilityNewBookingRequestHtml({
        dogName,
        clientName: ownerName,
        serviceType,
        startDate: formatEmailDate(startDate),
        endDate: formatEmailDate(endDate),
        bookingUrl,
      });

      for (const email of adminEmails) {
        await sendTransactionalEmail({
          to: email,
          subject: `New booking request for ${dogName}`,
          html,
        });
      }
    }

    await recordEmbedAttempt(db, ipAddress, facilityId, true);

    return NextResponse.json({
      ok: true,
      data: { bookingId: booking.id },
    });
  } catch (err) {
    console.error(
      "[embed submit] unexpected error:",
      err instanceof Error ? err.message : err,
    );
    await recordEmbedAttempt(db, ipAddress, facilityId, false);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
