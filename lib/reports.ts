import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PaymentReportRowDb, ProfileRow } from "@/lib/supabase/types";
import type { PaymentMethod, RevenueReport } from "@/lib/types";

export type ReportsErrorCode =
  | "incomplete_setup"
  | "unauthorized"
  | "validation"
  | "unknown";

export interface ReportsError {
  message: string;
  code: ReportsErrorCode;
}

type ReportsResult<T> =
  | { data: T; error: null }
  | { data: null; error: ReportsError };

function toError(
  message: string,
  code: ReportsErrorCode = "unknown",
): ReportsError {
  return { message, code };
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function rangeBounds(startDate: string, endDate: string): {
  start: string;
  end: string;
} | null {
  if (!startDate || !endDate || endDate < startDate) {
    return null;
  }

  return {
    start: `${startDate}T00:00:00.000Z`,
    end: `${endDate}T23:59:59.999Z`,
  };
}

async function requireProfile(): Promise<ReportsResult<ProfileRow>> {
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

export async function getRevenueReport(
  startDate: string,
  endDate: string,
): Promise<ReportsResult<RevenueReport>> {
  const profileResult = await requireProfile();
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  const bounds = rangeBounds(startDate, endDate);
  if (!bounds) {
    return {
      data: null,
      error: toError("Invalid date range.", "validation"),
    };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      *,
      dog_checkins (
        dog_id,
        dogs ( name )
      )
    `,
    )
    .eq("facility_id", profileResult.data.facility_id)
    .gte("paid_at", bounds.start)
    .lte("paid_at", bounds.end)
    .order("paid_at", { ascending: false });

  if (error) {
    return { data: null, error: toError(error.message) };
  }

  const rows = (data ?? []) as PaymentReportRowDb[];
  const paymentBreakdown = { cash: 0, card: 0, transfer: 0 };
  let totalRevenue = 0;
  let daycareVisits = 0;
  let boardingStays = 0;

  const payments = rows.map((row) => {
    const total = toNumber(row.total);
    totalRevenue += total;

    if (row.service_type === "daycare") {
      daycareVisits += 1;
    } else {
      boardingStays += 1;
    }

    paymentBreakdown[row.payment_method as PaymentMethod] += total;

    const dogName =
      row.dog_checkins?.dogs?.name ??
      "Unknown dog";

    return {
      id: row.id,
      dogName,
      serviceType: row.service_type,
      paidAt: row.paid_at,
      total,
      paymentMethod: row.payment_method,
    };
  });

  return {
    data: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalStays: payments.length,
      daycareVisits,
      boardingStays,
      paymentBreakdown: {
        cash: Math.round(paymentBreakdown.cash * 100) / 100,
        card: Math.round(paymentBreakdown.card * 100) / 100,
        transfer: Math.round(paymentBreakdown.transfer * 100) / 100,
      },
      payments,
    },
    error: null,
  };
}

export { INCOMPLETE_SETUP_MESSAGE };
