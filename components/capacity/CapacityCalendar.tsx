"use client";

import { Card, CardContent } from "@/components/ui/Card";
import {
  getDogsForCapacityDate,
  getMonthlyCapacityCounts,
  type DayCapacityCount,
} from "@/lib/capacity";
import { appearScale } from "@/lib/motion";
import type { CapacityDayDog } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, Loader2, Moon, Sun } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CapacityExpandType = "daycare" | "overnight";
type CalendarCell = DayCapacityCount | null;

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

function parseDateParts(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDayHeading(date: string): string {
  const asDate = parseDateParts(date);
  const weekday = asDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = asDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  return `${weekday}, ${monthDay}`;
}

function typeLabel(type: CapacityExpandType): string {
  return type === "daycare" ? "Daycare" : "Overnight";
}

function toServiceType(
  type: CapacityExpandType,
): "daycare" | "boarding" {
  return type === "overnight" ? "boarding" : "daycare";
}

function chunkIntoWeeks(
  days: DayCapacityCount[],
  leadingBlanks: number,
): CalendarCell[][] {
  const cells: CalendarCell[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...days,
  ];
  const weeks: CalendarCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

function CapacityCountButton({
  type,
  count,
  date,
  loading,
  expanded,
  controlsId,
  onClick,
}: {
  type: CapacityExpandType;
  count: number;
  date: string;
  loading: boolean;
  expanded: boolean;
  controlsId: string;
  onClick: () => void;
}) {
  const isDaycare = type === "daycare";
  const label = isDaycare ? "daycare" : "overnight";
  const Icon = isDaycare ? Sun : Moon;
  const numberClass = isDaycare ? "text-primary" : "text-warning";
  const dayHeading = formatDayHeading(date);

  const content = (
    <>
      <Icon className={cn("h-3 w-3 sm:hidden", numberClass)} aria-hidden />
      {loading ? (
        <Loader2
          className={cn("h-3 w-3 animate-spin", numberClass)}
          aria-hidden
        />
      ) : (
        <span className={cn("font-medium", numberClass)}>{count}</span>
      )}
      <span className="hidden sm:inline"> {label}</span>
    </>
  );

  if (count === 0) {
    return (
      <p className="flex items-center gap-0.5 text-foreground">{content}</p>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={expanded ? controlsId : undefined}
      aria-busy={loading || undefined}
      aria-label={
        expanded
          ? `Hide ${label} dogs for ${dayHeading}`
          : `Show ${count} ${label} dogs for ${dayHeading}`
      }
      className={cn(
        "flex items-center gap-0.5 rounded-md px-0.5 text-foreground underline decoration-dotted underline-offset-2",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
        isDaycare
          ? "hover:bg-mint-wash/50"
          : "hover:bg-warning/10",
        expanded && (isDaycare ? "bg-mint-wash/80" : "bg-warning/10"),
      )}
    >
      {content}
    </button>
  );
}

export function CapacityCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<DayCapacityCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<CapacityExpandType | null>(
    null,
  );
  const [expandedDogs, setExpandedDogs] = useState<CapacityDayDog[]>([]);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);
  const fetchGeneration = useRef(0);
  const stripId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setExpanded(mq.matches);

    function handleChange(event: MediaQueryListEvent) {
      setExpanded(event.matches);
    }

    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const collapseExpansion = useCallback(() => {
    fetchGeneration.current += 1;
    setExpandedDate(null);
    setExpandedType(null);
    setExpandedDogs([]);
    setExpandedLoading(false);
    setExpandedError(null);
  }, []);

  useEffect(() => {
    if (!expandedDate) return;

    function onPointerDown(event: PointerEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        collapseExpansion();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") collapseExpansion();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expandedDate, collapseExpansion]);

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
    collapseExpansion();
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  }

  async function openExpansion(date: string, type: CapacityExpandType) {
    const generation = fetchGeneration.current + 1;
    fetchGeneration.current = generation;
    setExpandedDate(date);
    setExpandedType(type);
    setExpandedDogs([]);
    setExpandedError(null);
    setExpandedLoading(true);

    const result = await getDogsForCapacityDate(date, toServiceType(type));
    if (generation !== fetchGeneration.current) return;

    setExpandedLoading(false);
    if (result.error) {
      setExpandedError(result.error.message);
      setExpandedDogs([]);
    } else {
      setExpandedDogs(result.data);
    }
  }

  function handleCountClick(date: string, type: CapacityExpandType) {
    if (expandedDate === date && expandedType === type) {
      collapseExpansion();
      return;
    }
    void openExpansion(date, type);
  }

  const weeks = chunkIntoWeeks(days, mondayBasedWeekday(year, month));

  return (
    <div ref={calendarRef}>
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
                <h3 className="font-semibold text-foreground">
                  Capacity Calendar
                </h3>
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
                          className="rounded-lg bg-[#F2D98A] px-0.5 py-2 text-center text-[10px] leading-tight font-bold text-[#06342F] sm:px-1 sm:text-xs"
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                    {weeks.map((week, weekIndex) => {
                      const weekHasExpansion = week.some(
                        (cell) => cell?.date === expandedDate,
                      );
                      const expandedCell = week.find(
                        (cell) => cell?.date === expandedDate,
                      );
                      const expandedCount =
                        expandedType === "overnight"
                          ? (expandedCell?.overnight ?? 0)
                          : (expandedCell?.daycare ?? 0);

                      return (
                        <div key={`week-${weekIndex}`} className="space-y-2">
                          <div className="grid grid-cols-7 gap-2">
                            {week.map((cell, cellIndex) =>
                              cell ? (
                                <div
                                  key={cell.date}
                                  className={cn(
                                    "min-h-[72px] rounded-xl border p-1.5 text-center sm:min-h-[88px] sm:p-2.5",
                                    isToday(cell.date)
                                      ? "border-primary bg-mint-wash"
                                      : "border-border bg-surface",
                                  )}
                                >
                                  <p className="text-sm font-semibold text-foreground">
                                    {dayNumber(cell.date)}
                                  </p>
                                  <div className="mt-1 flex flex-col items-center gap-0.5 text-[10px] tabular-nums sm:mt-1.5 sm:gap-1 sm:text-xs">
                                    <CapacityCountButton
                                      type="daycare"
                                      count={cell.daycare}
                                      date={cell.date}
                                      loading={
                                        expandedLoading &&
                                        expandedDate === cell.date &&
                                        expandedType === "daycare"
                                      }
                                      expanded={
                                        expandedDate === cell.date &&
                                        expandedType === "daycare"
                                      }
                                      controlsId={stripId}
                                      onClick={() =>
                                        handleCountClick(cell.date, "daycare")
                                      }
                                    />
                                    <CapacityCountButton
                                      type="overnight"
                                      count={cell.overnight}
                                      date={cell.date}
                                      loading={
                                        expandedLoading &&
                                        expandedDate === cell.date &&
                                        expandedType === "overnight"
                                      }
                                      expanded={
                                        expandedDate === cell.date &&
                                        expandedType === "overnight"
                                      }
                                      controlsId={stripId}
                                      onClick={() =>
                                        handleCountClick(
                                          cell.date,
                                          "overnight",
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div
                                  key={`blank-${weekIndex}-${cellIndex}`}
                                  className="min-h-[72px] rounded-xl border border-transparent p-1.5 sm:min-h-[88px] sm:p-2.5"
                                  aria-hidden
                                />
                              ),
                            )}
                          </div>

                          <AnimatePresence>
                            {weekHasExpansion &&
                            expandedDate &&
                            expandedType ? (
                              <motion.div
                                key={`${expandedDate}-${expandedType}`}
                                id={stripId}
                                role="region"
                                aria-label={`${formatDayHeading(expandedDate)} ${typeLabel(expandedType)} dogs`}
                                {...appearScale}
                              >
                                <div
                                  className="grid grid-cols-7 gap-2"
                                  aria-hidden
                                >
                                  {week.map((cell, cellIndex) => (
                                    <div
                                      key={
                                        cell?.date ??
                                        `anchor-${weekIndex}-${cellIndex}`
                                      }
                                      className={cn(
                                        "border-t-4",
                                        cell?.date === expandedDate
                                          ? expandedType === "daycare"
                                            ? "border-primary"
                                            : "border-warning"
                                          : "border-transparent",
                                      )}
                                    />
                                  ))}
                                </div>
                                <Card
                                  className={cn(
                                    "rounded-t-xl border-t-0",
                                    expandedType === "daycare"
                                      ? "bg-mint-wash"
                                      : "bg-marker/40",
                                  )}
                                >
                                  <CardContent className="p-4">
                                    <p className="text-sm font-semibold text-foreground">
                                      {formatDayHeading(expandedDate)} ·{" "}
                                      {typeLabel(expandedType)} (
                                      {expandedCount})
                                    </p>
                                    {expandedError ? (
                                      <p
                                        className="mt-2 text-sm text-danger"
                                        role="alert"
                                      >
                                        {expandedError}
                                      </p>
                                    ) : expandedLoading ? null : expandedDogs.length ===
                                      0 ? (
                                      <p className="mt-2 text-sm text-muted-foreground">
                                        No dogs
                                      </p>
                                    ) : (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {expandedDogs.map((dog) => (
                                          <Link
                                            key={dog.dogId}
                                            href={`/dogs/${dog.dogId}`}
                                            className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                                          >
                                            {dog.dogName}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
