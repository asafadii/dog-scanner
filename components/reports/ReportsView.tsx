"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatCard } from "@/components/ui/StatCard";
import { formatAmount } from "@/lib/currency";
import { getFacilitySettings } from "@/lib/facility";
import { getRevenueReport, INCOMPLETE_SETUP_MESSAGE } from "@/lib/reports";
import { getSubscriptionInfo } from "@/lib/subscription";
import type { RevenueReport, SubscriptionInfo } from "@/lib/types";
import {
  cn,
  currentMonthDateRange,
  formatReportDate,
} from "@/lib/utils";
import { BarChart3, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  transfer: "Transfer",
} as const;

export function ReportsView() {
  const defaultRange = useMemo(() => currentMonthDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [currency, setCurrency] = useState("EUR");

  useEffect(() => {
    void (async () => {
      const result = await getFacilitySettings();
      if (!result.error) {
        setCurrency(result.data.currency);
      }
    })();
  }, []);

  const formatPrice = (value: number) => formatAmount(value, currency);

  useEffect(() => {
    void (async () => {
      const result = await getSubscriptionInfo();
      if (!result.error) {
        setSubscription(result.data);
      }
      setSubscriptionLoaded(true);
    })();
  }, []);

  const isAdvancedGated =
    subscriptionLoaded &&
    subscription !== null &&
    subscription.plan === "dora";

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getRevenueReport(startDate, endDate);
    if (result.error) {
      setError(result.error.message);
      setReport(null);
    } else {
      setReport(result.data);
    }

    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const maxBreakdown = useMemo(() => {
    if (!report) return 1;
    return Math.max(
      report.paymentBreakdown.cash,
      report.paymentBreakdown.card,
      report.paymentBreakdown.transfer,
      1,
    );
  }, [report]);

  function handleExport() {
    if (!report) return;

    const rows = report.payments.map((payment) => ({
      Dog: payment.dogName,
      Service: payment.serviceType,
      Date: formatReportDate(payment.paidAt),
      Total: payment.total,
      Method: PAYMENT_METHOD_LABELS[payment.paymentMethod],
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(
      workbook,
      `dora-report-${startDate}-to-${endDate}.xlsx`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF4F1] text-primary">
          {/* #EAF4F1 documented mint-wash (D-04) — no named token */}
          <BarChart3 className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl text-foreground">
            Reports
          </h2>
          <p className="mt-1 text-muted-foreground">
            Revenue and payment history for your facility.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void loadReport()} disabled={loading}>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Apply Range
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={
                loading ||
                !report ||
                report.payments.length === 0 ||
                isAdvancedGated
              }
              title={
                isAdvancedGated ? "Available on DORA Unlimited" : undefined
              }
            >
              <Download className="h-4 w-4" aria-hidden />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
          <Loader2
            className="h-8 w-8 animate-spin text-primary"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger/25 bg-[#FEF2F2] px-6 py-12 text-center">
          {/* #FEF2F2 documented error-tint (D-04, mirrors Alert.tsx) */}
          <p className="text-sm font-medium text-danger" role="alert">
            {error}
          </p>
          {error !== INCOMPLETE_SETUP_MESSAGE && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void loadReport()}
            >
              Try again
            </Button>
          )}
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Revenue",
                value: formatPrice(report.totalRevenue),
              },
              { label: "Number of Stays", value: String(report.totalStays) },
              {
                label: "Daycare Visits",
                value: String(report.daycareVisits),
              },
              {
                label: "Boarding Stays",
                value: String(report.boardingStays),
              },
            ].map((stat) => (
              <StatCard
                key={stat.label}
                className="tabular-nums"
                value={stat.value}
                label={stat.label}
              />
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {(
                Object.entries(report.paymentBreakdown) as [
                  keyof typeof report.paymentBreakdown,
                  number,
                ][]
              ).map(([method, total]) => (
                <div key={method}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-foreground">
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                    <span className="tabular-nums text-foreground">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        method === "cash" && "bg-success",
                        method === "card" && "bg-primary",
                        method === "transfer" && "bg-marker",
                      )}
                      style={{ width: `${(total / maxBreakdown) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isAdvancedGated && (
                <div className="mb-4 rounded-xl border border-primary/20 bg-[#EAF4F1] px-4 py-3 text-sm text-foreground">
                  {/* #EAF4F1 documented mint-wash (D-04) — no named token */}
                  Upgrade to DORA Unlimited for advanced analytics and Excel
                  export.{" "}
                  <Link
                    href="/subscription"
                    className="font-medium text-primary hover:underline"
                  >
                    View plans
                  </Link>
                </div>
              )}
              {isAdvancedGated ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Payment details are available on DORA Unlimited.
                </p>
              ) : report.payments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No payments in this date range.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="px-2 py-3 font-medium">Dog</th>
                        <th className="px-2 py-3 font-medium">Service</th>
                        <th className="px-2 py-3 font-medium">Date</th>
                        <th className="px-2 py-3 font-medium">Total</th>
                        <th className="px-2 py-3 font-medium">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-2 py-3 font-medium text-foreground">
                            {payment.dogName}
                          </td>
                          <td className="px-2 py-3 capitalize text-muted-foreground">
                            {payment.serviceType}
                          </td>
                          <td className="px-2 py-3 text-muted-foreground">
                            {formatReportDate(payment.paidAt)}
                          </td>
                          <td className="px-2 py-3 tabular-nums text-foreground">
                            {formatPrice(payment.total)}
                          </td>
                          <td className="px-2 py-3 capitalize text-muted-foreground">
                            {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
