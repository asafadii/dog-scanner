"use client";

import { Card, CardContent } from "@/components/ui/Card";
import {
  getMonthlyCapacityCounts,
  type DayCapacityCount,
} from "@/lib/capacity";
import { appearScale } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayNumber(date: string): number {
  const [, , day] = date.split("-").map(Number);
  return day;
}

function mondayBasedWeekday(year: number, month: number): number {
  const weekday = new Date(year, month - 1, 1).getDay();
  return weekday === 0 ? 6 : weekday - 1;
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
            {/* mint-wash icon chip (#EAF4F1) — documented D-04 exception, no named token */}
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-wash text-primary">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold text-foreground">Capacity Calendar</h3>
              <p className="text-xs text-muted-foreground">
                Daycare and overnight counts per day
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              key="capacity-calendar-content"
              className="mt-4 space-y-4"
              {...appearScale}
            >
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="min-h-[44px] rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Previous
              </button>
              <p className="text-sm font-semibold text-foreground">
                {monthLabel(year, month)}
              </p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="min-h-[44px] rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Next
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  className="h-6 w-6 animate-spin text-primary"
                  aria-hidden
                />
              </div>
            ) : error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAY_HEADERS.map((label) => (
                    <div
                      key={label}
                      className="rounded-lg bg-[#F2D98A] px-1 py-2 text-center text-xs font-bold text-[#06342F]"
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: mondayBasedWeekday(year, month) }).map(
                    (_, index) => (
                      <div
                        key={`blank-${index}`}
                        className="min-h-[88px] rounded-xl border border-transparent p-2.5"
                        aria-hidden
                      />
                    ),
                  )}
                  {days.map((day) => (
                    <div
                      key={day.date}
                      className={cn(
                        "min-h-[88px] rounded-xl border p-2.5 text-center",
                        isToday(day.date)
                          ? "border-primary bg-mint-wash"
                          : "border-border bg-surface",
                      )}
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {dayNumber(day.date)}
                      </p>
                      <div className="mt-1.5 space-y-0.5 text-xs tabular-nums">
                        <p className="text-foreground">
                          <span className="font-medium text-primary">
                            {day.daycare}
                          </span>{" "}
                          daycare
                        </p>
                        <p className="text-foreground">
                          <span className="font-medium text-warning">
                            {day.overnight}
                          </span>{" "}
                          overnight
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
