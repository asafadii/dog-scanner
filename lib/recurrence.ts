import type {
  BookingServiceType,
  RecurrenceFrequency,
  RecurringBookingInput,
} from "@/lib/types";

export const MAX_RECURRING_OCCURRENCES = 104;

export const WEEKDAY_LABELS = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 0, short: "Sun", long: "Sunday" },
] as const;

export function parseLocalDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(iso: string, days: number): string {
  const date = parseLocalDateString(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return formatLocalDateString(date);
}

export function addCalendarMonths(iso: string, months: number): string {
  const date = parseLocalDateString(iso);
  if (!date) return iso;

  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return formatLocalDateString(date);
}

export function calendarDaysBetween(startIso: string, endIso: string): number {
  const start = parseLocalDateString(startIso);
  const end = parseLocalDateString(endIso);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function weekdayFromDateString(iso: string): number | null {
  const date = parseLocalDateString(iso);
  if (!date) return null;
  return date.getDay();
}

function startOfWeekSunday(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - date.getDay(),
  );
}

function daysBetweenDates(a: Date, b: Date): number {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function enumerateRecurringOccurrenceDates(input: {
  recurrenceStartDate: string;
  recurrenceEndDate: string;
  recurrenceFreq: RecurrenceFrequency;
  recurrenceDaysOfWeek: number[];
}): string[] {
  const start = parseLocalDateString(input.recurrenceStartDate);
  const end = parseLocalDateString(input.recurrenceEndDate);
  if (!start || !end || end < start) return [];

  const days = new Set(
    input.recurrenceDaysOfWeek.filter(
      (day) => Number.isInteger(day) && day >= 0 && day <= 6,
    ),
  );
  if (days.size === 0) return [];

  const dates: string[] = [];
  const originWeek = startOfWeekSunday(start);
  const current = new Date(start);

  while (current <= end) {
    if (days.has(current.getDay())) {
      if (input.recurrenceFreq === "biweekly") {
        const weekIndex = Math.floor(
          daysBetweenDates(originWeek, startOfWeekSunday(current)) / 7,
        );
        if (weekIndex % 2 !== 0) {
          current.setDate(current.getDate() + 1);
          continue;
        }
      }
      dates.push(formatLocalDateString(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function boardingStayLengthDays(
  serviceType: BookingServiceType,
  recurrenceStartDate: string,
  firstOccurrenceEndDate: string,
): number {
  if (serviceType !== "boarding") return 0;
  return Math.max(0, calendarDaysBetween(recurrenceStartDate, firstOccurrenceEndDate));
}

export function enumerateRecurringOccurrences(
  input: Pick<
    RecurringBookingInput,
    | "recurrenceStartDate"
    | "recurrenceEndDate"
    | "recurrenceFreq"
    | "recurrenceDaysOfWeek"
    | "serviceType"
    | "endDate"
  >,
): { startDate: string; endDate: string }[] {
  const stayLength = boardingStayLengthDays(
    input.serviceType,
    input.recurrenceStartDate,
    input.endDate,
  );

  return enumerateRecurringOccurrenceDates(input).map((date) => ({
    startDate: date,
    endDate: addCalendarDays(date, stayLength),
  }));
}

function formatDayList(daysOfWeek: number[]): string {
  const names = WEEKDAY_LABELS.filter((day) =>
    daysOfWeek.includes(day.value),
  ).map((day) => day.long);

  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function formatRecurringUntilDate(iso: string): string {
  const date = parseLocalDateString(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatRecurringBookingSummary(input: {
  recurrenceFreq: RecurrenceFrequency;
  recurrenceDaysOfWeek: number[];
  recurrenceEndDate: string;
  occurrenceCount: number;
}): string | null {
  if (!input.recurrenceEndDate || input.recurrenceDaysOfWeek.length === 0) {
    return null;
  }

  const daysLabel = formatDayList(input.recurrenceDaysOfWeek);
  if (!daysLabel) return null;

  const until = formatRecurringUntilDate(input.recurrenceEndDate);
  const visits = formatVisitCount(input.occurrenceCount);

  if (input.recurrenceFreq === "biweekly") {
    return `Repeats every 2 weeks on ${daysLabel} until ${until} · ${visits}`;
  }

  return `Repeats every ${daysLabel} until ${until} · ${visits}`;
}

function formatVisitCount(count: number): string {
  return `${count} ${count === 1 ? "visit" : "visits"}`;
}

export function formatRecurringPatternLine(input: {
  recurrenceFreq: RecurrenceFrequency;
  recurrenceDaysOfWeek: number[];
  occurrenceCount: number;
}): string | null {
  const daysLabel = formatDayList(input.recurrenceDaysOfWeek);
  if (!daysLabel) return null;

  const visits = formatVisitCount(input.occurrenceCount);
  if (input.recurrenceFreq === "biweekly") {
    return `Every 2 weeks on ${daysLabel} · ${visits}`;
  }

  return `Every ${daysLabel} · ${visits}`;
}
