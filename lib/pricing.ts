import { checkOutDog, getEffectiveServiceType, resolveStoredCheckinServiceType } from "@/lib/checkins";
import { clarity } from "@/lib/clarity";
import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  BookingItemRow,
  BookingRow,
  DogCheckinRow,
  PaymentRow,
  PricingRulesRow,
  ProfileRow,
} from "@/lib/supabase/types";
import type {
  BookingServiceType,
  FoodSource,
  Payment,
  PaymentMethod,
  PricingRules,
  StayPriceBreakdown,
} from "@/lib/types";

export const DEFAULT_DAYCARE_RATE = 25;
export const DEFAULT_BOARDING_RATE = 40;
export const DEFAULT_TRANSPORT_FEE = 10;
export const DEFAULT_FOOD_FEE = 5;

export type PricingErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "not_found"
  | "already_paid"
  | "validation"
  | "unknown";

export interface PricingError {
  message: string;
  code: PricingErrorCode;
}

type PricingResult<T> =
  | { data: T; error: null }
  | { data: null; error: PricingError };

export interface UpdatePricingRulesInput {
  daycareRate?: number;
  boardingRate?: number;
  transportFee?: number;
  foodFee?: number;
  seasonalSurchargeEnabled?: boolean;
  seasonalSurchargePercent?: number;
}

export interface RecordPaymentInput {
  paymentMethod: PaymentMethod;
  foodAddon?: boolean;
  clientPassId?: string;
}

export interface CalculateStayPriceOptions {
  foodAddon?: boolean;
}

type PricingRulesUpdatePayload = {
  daycare_rate?: number;
  boarding_rate?: number;
  transport_fee?: number;
  food_fee?: number;
  seasonal_surcharge_enabled?: boolean;
  seasonal_surcharge_percent?: number;
  updated_at: string;
};

export type StayPriceResult = StayPriceBreakdown & {
  foodAddonOnBooking: boolean;
  configuredFoodFee: number;
  bookingFoodSource: FoodSource | null;
  clientId: string | null;
};

function toError(
  message: string,
  code: PricingErrorCode = "unknown",
): PricingError {
  return { message, code };
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function passPaymentErrorMessage(message: string | undefined): string {
  if (!message) {
    return "This pass cannot be used for this checkout.";
  }
  const lowered = message.toLowerCase();
  if (
    lowered.includes("cannot be used") ||
    lowered.includes("does not belong") ||
    lowered.includes("exhausted")
  ) {
    if (lowered.includes("does not belong")) {
      return "This pass does not belong to this client or facility.";
    }
    return "This pass cannot be used for this checkout.";
  }
  return message;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapPricingRulesRow(row: PricingRulesRow): PricingRules {
  return {
    facilityId: row.facility_id,
    daycareRate: toNumber(row.daycare_rate),
    boardingRate: toNumber(row.boarding_rate),
    transportFee: toNumber(row.transport_fee),
    foodFee: toNumber(row.food_fee),
    seasonalSurchargeEnabled: row.seasonal_surcharge_enabled,
    seasonalSurchargePercent: toNumber(row.seasonal_surcharge_percent),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPaymentRow(row: PaymentRow): Payment {
  return {
    id: row.id,
    checkinId: row.checkin_id,
    bookingId: row.booking_id,
    serviceType: row.service_type,
    units: row.units,
    rate: toNumber(row.rate),
    transportFee: toNumber(row.transport_fee),
    foodFee: toNumber(row.food_fee),
    surchargePercent: toNumber(row.surcharge_percent),
    subtotal: toNumber(row.subtotal),
    total: toNumber(row.total),
    paymentMethod: row.payment_method as PaymentMethod,
    paidAt: row.paid_at,
  };
}

function calendarDaysInclusive(start: Date, end: Date): number {
  const startDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffMs = endDay.getTime() - startDay.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  return Math.max(1, diffDays + 1);
}

function calendarNights(start: Date, end: Date): number {
  return Math.max(1, calendarDaysInclusive(start, end) - 1);
}

function computeUnits(
  serviceType: BookingServiceType,
  checkedInAt: string,
  checkoutAt: Date,
): number {
  const checkInDate = new Date(checkedInAt);
  if (serviceType === "boarding") {
    return calendarNights(checkInDate, checkoutAt);
  }
  return calendarDaysInclusive(checkInDate, checkoutAt);
}

function computeBreakdown(
  rules: PricingRules,
  serviceType: BookingServiceType,
  units: number,
  transportRequired: boolean,
  foodAddonActive: boolean,
): StayPriceBreakdown {
  const rate =
    serviceType === "daycare" ? rules.daycareRate : rules.boardingRate;
  const transportFee = transportRequired ? rules.transportFee : 0;
  const foodFee = foodAddonActive ? rules.foodFee : 0;
  const surchargePercent = rules.seasonalSurchargeEnabled
    ? rules.seasonalSurchargePercent
    : 0;
  const subtotal = roundMoney(units * rate + transportFee + foodFee);
  const total = roundMoney(subtotal * (1 + surchargePercent / 100));

  return {
    serviceType,
    units,
    rate,
    transportFee,
    foodFee,
    surchargePercent,
    subtotal,
    total,
  };
}

async function requireProfile(): Promise<PricingResult<ProfileRow>> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: toError("Not signed in", "unauthorized") };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { data: null, error: toError(profileError.message) };
  }

  if (!profile) {
    return {
      data: null,
      error: toError(INCOMPLETE_SETUP_MESSAGE, "incomplete_setup"),
    };
  }

  return { data: profile as ProfileRow, error: null };
}

export async function getPricingRules(): Promise<PricingResult<PricingRules>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const facilityId = profileResult.data.facility_id;
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("pricing_rules")
      .insert({ facility_id: facilityId })
      .select("*")
      .single();

    if (insertError) {
      return { data: null, error: toError(insertError.message) };
    }

    return {
      data: mapPricingRulesRow(inserted as PricingRulesRow),
      error: null,
    };
  }

  return { data: mapPricingRulesRow(data as PricingRulesRow), error: null };
}

export async function updatePricingRules(
  updates: UpdatePricingRulesInput,
): Promise<PricingResult<PricingRules>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const rulesResult = await getPricingRules();
  if (rulesResult.error) {
    return { data: null, error: rulesResult.error };
  }

  const payload: PricingRulesUpdatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (updates.daycareRate !== undefined) {
    if (updates.daycareRate < 0) {
      return {
        data: null,
        error: toError("Daycare rate cannot be negative.", "validation"),
      };
    }
    payload.daycare_rate = roundMoney(updates.daycareRate);
  }

  if (updates.boardingRate !== undefined) {
    if (updates.boardingRate < 0) {
      return {
        data: null,
        error: toError("Boarding rate cannot be negative.", "validation"),
      };
    }
    payload.boarding_rate = roundMoney(updates.boardingRate);
  }

  if (updates.transportFee !== undefined) {
    if (updates.transportFee < 0) {
      return {
        data: null,
        error: toError("Transport fee cannot be negative.", "validation"),
      };
    }
    payload.transport_fee = roundMoney(updates.transportFee);
  }

  if (updates.foodFee !== undefined) {
    if (updates.foodFee < 0) {
      return {
        data: null,
        error: toError("Food fee cannot be negative.", "validation"),
      };
    }
    payload.food_fee = roundMoney(updates.foodFee);
  }

  if (updates.seasonalSurchargeEnabled !== undefined) {
    payload.seasonal_surcharge_enabled = updates.seasonalSurchargeEnabled;
  }

  if (updates.seasonalSurchargePercent !== undefined) {
    if (updates.seasonalSurchargePercent < 0) {
      return {
        data: null,
        error: toError("Surcharge percent cannot be negative.", "validation"),
      };
    }
    payload.seasonal_surcharge_percent = roundMoney(
      updates.seasonalSurchargePercent,
    );
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pricing_rules")
    .update(payload)
    .eq("facility_id", profileResult.data.facility_id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  return { data: mapPricingRulesRow(data as PricingRulesRow), error: null };
}

async function loadStayContext(
  checkinId: string,
  facilityId: string,
): Promise<
  PricingResult<{
    checkin: DogCheckinRow;
    booking: BookingRow | null;
    bookingItem: BookingItemRow | null;
    rules: PricingRules;
    clientId: string | null;
  }>
> {
  const supabase = createSupabaseBrowserClient();

  const { data: checkin, error: checkinError } = await supabase
    .from("dog_checkins")
    .select("*")
    .eq("id", checkinId)
    .eq("facility_id", facilityId)
    .is("checked_out_at", null)
    .maybeSingle();

  if (checkinError) {
    return { data: null, error: toError(checkinError.message) };
  }

  if (!checkin) {
    return {
      data: null,
      error: toError("Active check-in not found", "not_found"),
    };
  }

  const rulesResult = await getPricingRules();
  if (rulesResult.error) {
    return { data: null, error: rulesResult.error };
  }

  let booking: BookingRow | null = null;
  let bookingItem: BookingItemRow | null = null;

  if (checkin.booking_id) {
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", checkin.booking_id)
      .eq("facility_id", facilityId)
      .maybeSingle();

    if (bookingError) {
      return { data: null, error: toError(bookingError.message) };
    }

    booking = (bookingData as BookingRow | null) ?? null;

    const { data: itemData, error: itemError } = await supabase
      .from("booking_items")
      .select("*")
      .eq("booking_id", checkin.booking_id)
      .maybeSingle();

    if (itemError) {
      return { data: null, error: toError(itemError.message) };
    }

    bookingItem = (itemData as BookingItemRow | null) ?? null;
  }

  let clientId = booking?.client_id ?? null;
  if (!clientId) {
    const { data: dog, error: dogError } = await supabase
      .from("dogs")
      .select("client_id")
      .eq("id", checkin.dog_id)
      .eq("facility_id", facilityId)
      .maybeSingle();

    if (dogError) {
      return { data: null, error: toError(dogError.message) };
    }

    clientId = (dog as { client_id: string | null } | null)?.client_id ?? null;
  }

  return {
    data: {
      checkin: checkin as DogCheckinRow,
      booking,
      bookingItem,
      rules: rulesResult.data,
      clientId,
    },
    error: null,
  };
}

export async function calculateStayPrice(
  checkinId: string,
  options?: CalculateStayPriceOptions,
): Promise<PricingResult<StayPriceResult>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const contextResult = await loadStayContext(
    checkinId,
    profileResult.data.facility_id,
  );
  if (contextResult.error) {
    return { data: null, error: contextResult.error };
  }

  const { checkin, booking, bookingItem, rules } = contextResult.data;
  const checkoutAt = new Date();
  const storedServiceType = resolveStoredCheckinServiceType(
    checkin.current_service_type,
    booking?.service_type,
  );
  // Effective type is calculation-only — stored booking.service_type is unchanged.
  // Same-calendar-day checkout → daycare (52a); 24h+ → boarding (§18.3).
  const serviceType: BookingServiceType = getEffectiveServiceType(
    checkin.checked_in_at,
    storedServiceType,
    checkoutAt,
  );
  const units = computeUnits(
    serviceType,
    checkin.checked_in_at,
    checkoutAt,
  );
  const foodAddonOnBooking = bookingItem?.food_addon ?? false;
  const foodAddonActive =
    foodAddonOnBooking || options?.foodAddon === true;

  const breakdown = computeBreakdown(
    rules,
    serviceType,
    units,
    booking?.transport_required ?? false,
    foodAddonActive,
  );

  return {
    data: {
      ...breakdown,
      foodAddonOnBooking,
      configuredFoodFee: rules.foodFee,
      bookingFoodSource: booking?.food_source ?? null,
      clientId: contextResult.data.clientId,
    },
    error: null,
  };
}

async function completeLinkedBooking(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  facilityId: string,
  bookingId: string | null,
  knownStatus?: string | null,
): Promise<PricingResult<null>> {
  if (!bookingId) {
    return { data: null, error: null };
  }

  let status = knownStatus;
  if (status === undefined) {
    const { data: booking, error: lookupError } = await supabase
      .from("bookings")
      .select("status")
      .eq("id", bookingId)
      .eq("facility_id", facilityId)
      .maybeSingle();

    if (lookupError) {
      return { data: null, error: toError(lookupError.message) };
    }

    if (!booking) {
      return { data: null, error: null };
    }

    status = (booking as Pick<BookingRow, "status">).status;
  }

  if (status === "completed") {
    return { data: null, error: null };
  }

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("facility_id", facilityId);

  if (bookingError) {
    return { data: null, error: toError(bookingError.message) };
  }

  return { data: null, error: null };
}

export async function recordPayment(
  checkinId: string,
  input: RecordPaymentInput,
): Promise<PricingResult<Payment>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const supabase = createSupabaseBrowserClient();
  const facilityId = profileResult.data.facility_id;

  const [{ data: existingPayment, error: existingError }, { data: checkinRow, error: checkinError }] =
    await Promise.all([
      supabase
        .from("payments")
        .select("*")
        .eq("checkin_id", checkinId)
        .eq("facility_id", facilityId)
        .maybeSingle(),
      supabase
        .from("dog_checkins")
        .select("checked_out_at")
        .eq("id", checkinId)
        .eq("facility_id", facilityId)
        .maybeSingle(),
    ]);

  if (existingError) {
    return { data: null, error: toError(existingError.message) };
  }

  if (checkinError) {
    return { data: null, error: toError(checkinError.message) };
  }

  if (existingPayment) {
    if (checkinRow?.checked_out_at) {
      return {
        data: null,
        error: toError("This stay has already been paid.", "already_paid"),
      };
    }

    const bookingCompleteResult = await completeLinkedBooking(
      supabase,
      facilityId,
      existingPayment.booking_id,
    );
    if (bookingCompleteResult.error) {
      return { data: null, error: bookingCompleteResult.error };
    }

    const checkoutResult = await checkOutDog(checkinId);
    if (checkoutResult.error) {
      return { data: null, error: toError(checkoutResult.error.message) };
    }

    clarity("event", "checkout_completed");
    return {
      data: mapPaymentRow(existingPayment as PaymentRow),
      error: null,
    };
  }

  const contextResult = await loadStayContext(
    checkinId,
    profileResult.data.facility_id,
  );
  if (contextResult.error) {
    return { data: null, error: contextResult.error };
  }

  const { checkin, booking, bookingItem } = contextResult.data;
  const bookingId = checkin.booking_id;

  if (input.foodAddon && bookingId && !bookingItem) {
    const { error: itemError } = await supabase.from("booking_items").insert({
      booking_id: bookingId,
      food_addon: true,
    });

    if (itemError) {
      return { data: null, error: toError(itemError.message) };
    }
  }

  const priceResult = await calculateStayPrice(checkinId, {
    foodAddon: input.foodAddon,
  });
  if (priceResult.error) {
    return { data: null, error: priceResult.error };
  }

  const breakdown = priceResult.data;
  let paymentRow: PaymentRow | null = null;

  if (input.paymentMethod === "pass") {
    if (!input.clientPassId) {
      return {
        data: null,
        error: toError("Select a pass to pay with.", "validation"),
      };
    }

    const clientId = contextResult.data.clientId;
    if (!clientId) {
      return {
        data: null,
        error: toError(
          "This stay is not linked to a client, so a pass cannot be used.",
          "validation",
        ),
      };
    }

    const { data: rpcRow, error: rpcError } = await supabase.rpc(
      "record_pass_payment",
      {
        p_checkin_id: checkinId,
        p_booking_id: bookingId,
        p_facility_id: facilityId,
        p_service_type: breakdown.serviceType,
        p_units: breakdown.units,
        p_rate: breakdown.rate,
        p_transport_fee: breakdown.transportFee,
        p_food_fee: breakdown.foodFee,
        p_surcharge_percent: breakdown.surchargePercent,
        p_subtotal: breakdown.subtotal,
        p_total: breakdown.total,
        p_recorded_by: profileResult.data.id,
        p_client_pass_id: input.clientPassId,
        p_client_id: clientId,
      },
    );

    const resolvedRow = Array.isArray(rpcRow) ? rpcRow[0] : rpcRow;
    if (rpcError || !resolvedRow) {
      return {
        data: null,
        error: toError(passPaymentErrorMessage(rpcError?.message), "validation"),
      };
    }

    paymentRow = resolvedRow as PaymentRow;
  } else {
    const insertResult = await supabase
      .from("payments")
      .insert({
        checkin_id: checkinId,
        booking_id: bookingId,
        facility_id: profileResult.data.facility_id,
        service_type: breakdown.serviceType,
        units: breakdown.units,
        rate: breakdown.rate,
        transport_fee: breakdown.transportFee,
        food_fee: breakdown.foodFee,
        surcharge_percent: breakdown.surchargePercent,
        subtotal: breakdown.subtotal,
        total: breakdown.total,
        payment_method: input.paymentMethod,
        recorded_by: profileResult.data.id,
      })
      .select("*")
      .single();

    if (insertResult.error) {
      return { data: null, error: toError(insertResult.error.message) };
    }

    paymentRow = insertResult.data as PaymentRow;
  }

  const bookingCompleteResult = await completeLinkedBooking(
    supabase,
    profileResult.data.facility_id,
    bookingId,
    booking?.status,
  );
  if (bookingCompleteResult.error) {
    return { data: null, error: bookingCompleteResult.error };
  }

  const checkoutResult = await checkOutDog(checkinId);
  if (checkoutResult.error) {
    return { data: null, error: toError(checkoutResult.error.message) };
  }

  clarity("event", "checkout_completed");
  return {
    data: mapPaymentRow(paymentRow as PaymentRow),
    error: null,
  };
}

export { INCOMPLETE_SETUP_MESSAGE };
