"use client";

import { Card, CardContent } from "@/components/ui/Card";
import {
  getMonthlyCapacityCounts,
  type DayCapacityCount,
} from "@/lib/capacity";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function formatDayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function isToday(date: string): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return date === `${year}-${month}-${day}`;
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function CapacityCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<DayCapacityCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setExpanded(mq.matches);

    function handleChange(event: MediaQueryListEvent) {
      setExpanded(event.matches);
    }

    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getMonthlyCapacityCounts(year, month);
    if (result.error) {
      setError(result.error.message);
      setDays([]);
    } else {
      setDays(result.data);
    }

    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  function shiftMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  }

  return (
    <Card>
      <CardContent className="p-4">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FAF9] text-[oklch(0.531_0.092_185.0)]">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold text-stone-900">Capacity Calendar</h3>
              <p className="text-xs text-stone-500">
                Daycare and overnight counts per day
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-stone-400 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {expanded && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="min-h-[44px] rounded-lg px-3 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Previous
              </button>
              <p className="text-sm font-semibold text-stone-900">
                {monthLabel(year, month)}
              </p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="min-h-[44px] rounded-lg px-3 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Next
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  className="h-6 w-6 animate-spin text-[oklch(0.531_0.092_185.0)]"
                  aria-hidden
                />
              </div>
            ) : error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                {days.map((day) => (
                  <div
                    key={day.date}
                    className={cn(
                      "rounded-xl border p-2.5 text-center",
                      isToday(day.date)
                        ? "border-[oklch(0.531_0.092_185.0)] bg-[#F0FAF9]"
                        : "border-stone-200 bg-white",
                    )}
                  >
                    <p className="text-xs font-medium text-stone-500">
                      {formatDayLabel(day.date)}
                    </p>
                    <div className="mt-1.5 space-y-0.5 text-xs tabular-nums">
                      <p className="text-stone-700">
                        <span className="font-medium text-[oklch(0.531_0.092_185.0)]">
                          {day.daycare}
                        </span>{" "}
                        daycare
                      </p>
                      <p className="text-stone-700">
                        <span className="font-medium text-amber-700">
                          {day.overnight}
                        </span>{" "}
                        overnight
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
