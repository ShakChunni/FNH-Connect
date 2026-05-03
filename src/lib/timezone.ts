import { formatInTimeZone } from "date-fns-tz";

export const BDT_TIME_ZONE = "Asia/Dhaka";
export const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

interface CalendarDateParts {
  year: number;
  month: number; // zero-based
  day: number;
}

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

function toCalendarDateParts(date: Date): CalendarDateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function formatCalendarPartsISO(parts: CalendarDateParts): string {
  return `${parts.year}-${padTwo(parts.month + 1)}-${padTwo(parts.day)}`;
}

function parseCalendarDateISO(value: string): CalendarDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month, day };
}

function getNowInBDT(reference: Date = new Date()): Date {
  return new Date(reference.getTime() + BDT_OFFSET_MS);
}

function getTodayBDTCalendarDateParts(reference: Date = new Date()): CalendarDateParts {
  const bdtNow = getNowInBDT(reference);
  return {
    year: bdtNow.getUTCFullYear(),
    month: bdtNow.getUTCMonth(),
    day: bdtNow.getUTCDate(),
  };
}

function addDaysToCalendarParts(
  parts: CalendarDateParts,
  days: number,
): CalendarDateParts {
  const result = new Date(Date.UTC(parts.year, parts.month, parts.day + days));
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth(),
    day: result.getUTCDate(),
  };
}

function getUTCMidnightInstantForBDTDate(parts: CalendarDateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month, parts.day) - BDT_OFFSET_MS);
}

function getLocalCalendarDateFromParts(parts: CalendarDateParts): Date {
  return new Date(parts.year, parts.month, parts.day);
}

function normalizeDateInput(value: string | Date): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date input");
  }
  return date;
}

export function formatCalendarDateISO(date: Date): string {
  return formatCalendarPartsISO(toCalendarDateParts(date));
}

export function getUTCStartOfBDTDayFromCalendarDate(date: Date): Date {
  return getUTCMidnightInstantForBDTDate(toCalendarDateParts(date));
}

export function getUTCEndExclusiveOfBDTDayFromCalendarDate(date: Date): Date {
  const nextDay = addDaysToCalendarParts(toCalendarDateParts(date), 1);
  return getUTCMidnightInstantForBDTDate(nextDay);
}

export function buildBDTQueryDateRange(
  startDate?: Date | null,
  endDate?: Date | null,
): { startDate?: string; endDate?: string } {
  const params: { startDate?: string; endDate?: string } = {};

  if (startDate) {
    params.startDate = getUTCStartOfBDTDayFromCalendarDate(startDate).toISOString();
  }

  if (endDate) {
    params.endDate = getUTCEndExclusiveOfBDTDayFromCalendarDate(endDate).toISOString();
  }

  return params;
}

export function getBDTPresetCalendarRange(option: string): {
  start: Date | null;
  end: Date | null;
} {
  const todayParts = getTodayBDTCalendarDateParts();
  const today = getLocalCalendarDateFromParts(todayParts);

  switch (option) {
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const yesterdayParts = addDaysToCalendarParts(todayParts, -1);
      const yesterday = getLocalCalendarDateFromParts(yesterdayParts);
      return { start: yesterday, end: yesterday };
    }
    case "last7days": {
      const startParts = addDaysToCalendarParts(todayParts, -6);
      return {
        start: getLocalCalendarDateFromParts(startParts),
        end: today,
      };
    }
    case "last30days": {
      const startParts = addDaysToCalendarParts(todayParts, -29);
      return {
        start: getLocalCalendarDateFromParts(startParts),
        end: today,
      };
    }
    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: today };
    }
    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
}

export type SessionCashDatePreset =
  | "today"
  | "yesterday"
  | "lastWeek"
  | "thisMonth"
  | "lastCalendarMonth"
  | "last30Days"
  | "custom";

export function getSessionCashUTCDateRange(
  datePreset: string,
  customStartDate?: string,
  customEndDate?: string,
): {
  startDate: Date;
  endDate: Date;
  periodLabel: string;
} {
  const today = getTodayBDTCalendarDateParts();
  const tomorrow = addDaysToCalendarParts(today, 1);

  switch (datePreset as SessionCashDatePreset) {
    case "yesterday": {
      const yesterday = addDaysToCalendarParts(today, -1);
      return {
        startDate: getUTCMidnightInstantForBDTDate(yesterday),
        endDate: getUTCMidnightInstantForBDTDate(today),
        periodLabel: "Yesterday",
      };
    }
    case "lastWeek": {
      const start = addDaysToCalendarParts(today, -6);
      return {
        startDate: getUTCMidnightInstantForBDTDate(start),
        endDate: getUTCMidnightInstantForBDTDate(tomorrow),
        periodLabel: "Last 7 Days",
      };
    }
    case "thisMonth": {
      const monthStart: CalendarDateParts = {
        year: today.year,
        month: today.month,
        day: 1,
      };
      return {
        startDate: getUTCMidnightInstantForBDTDate(monthStart),
        endDate: getUTCMidnightInstantForBDTDate(tomorrow),
        periodLabel: "This Month",
      };
    }
    case "lastCalendarMonth": {
      const thisMonthStart: CalendarDateParts = {
        year: today.year,
        month: today.month,
        day: 1,
      };
      const lastMonthEnd = addDaysToCalendarParts(thisMonthStart, -1);
      const lastMonthStart: CalendarDateParts = {
        year: lastMonthEnd.year,
        month: lastMonthEnd.month,
        day: 1,
      };
      return {
        startDate: getUTCMidnightInstantForBDTDate(lastMonthStart),
        endDate: getUTCMidnightInstantForBDTDate(thisMonthStart),
        periodLabel: "Last Month",
      };
    }
    case "last30Days": {
      const start = addDaysToCalendarParts(today, -29);
      return {
        startDate: getUTCMidnightInstantForBDTDate(start),
        endDate: getUTCMidnightInstantForBDTDate(tomorrow),
        periodLabel: "Last 30 Days",
      };
    }
    case "custom": {
      const startParts =
        customStartDate && parseCalendarDateISO(customStartDate)
          ? parseCalendarDateISO(customStartDate)
          : null;
      const endParts =
        customEndDate && parseCalendarDateISO(customEndDate)
          ? parseCalendarDateISO(customEndDate)
          : null;

      if (startParts && endParts) {
        const endExclusive = addDaysToCalendarParts(endParts, 1);
        return {
          startDate: getUTCMidnightInstantForBDTDate(startParts),
          endDate: getUTCMidnightInstantForBDTDate(endExclusive),
          periodLabel: `${formatCalendarPartsISO(startParts)} - ${formatCalendarPartsISO(endParts)}`,
        };
      }

      return {
        startDate: getUTCMidnightInstantForBDTDate(today),
        endDate: getUTCMidnightInstantForBDTDate(tomorrow),
        periodLabel: "Today",
      };
    }
    case "today":
    default:
      return {
        startDate: getUTCMidnightInstantForBDTDate(today),
        endDate: getUTCMidnightInstantForBDTDate(tomorrow),
        periodLabel: "Today",
      };
  }
}

/**
 * Returns ISO date strings for a given preset (for APIs that expect string dates).
 * Useful for admin shift filtering and other legacy endpoints.
 */
export function getBDTDateRangeFromPreset(
  preset: "today" | "yesterday" | "lastWeek" | "lastMonth",
): { startDate: string; endDate: string } {
  const today = getTodayBDTCalendarDateParts();

  switch (preset) {
    case "today": {
      const date = formatCalendarPartsISO(today);
      return { startDate: date, endDate: date };
    }
    case "yesterday": {
      const yesterday = addDaysToCalendarParts(today, -1);
      const date = formatCalendarPartsISO(yesterday);
      return { startDate: date, endDate: date };
    }
    case "lastWeek": {
      const todayLocal = getLocalCalendarDateFromParts(today);
      const currentWeekDay = todayLocal.getDay(); // Sunday=0
      const currentWeekStart = addDaysToCalendarParts(today, -currentWeekDay);
      const lastWeekStart = addDaysToCalendarParts(currentWeekStart, -7);
      const lastWeekEnd = addDaysToCalendarParts(currentWeekStart, -1);
      return {
        startDate: formatCalendarPartsISO(lastWeekStart),
        endDate: formatCalendarPartsISO(lastWeekEnd),
      };
    }
    case "lastMonth": {
      const thisMonthStart: CalendarDateParts = {
        year: today.year,
        month: today.month,
        day: 1,
      };
      const lastMonthEnd = addDaysToCalendarParts(thisMonthStart, -1);
      const lastMonthStart: CalendarDateParts = {
        year: lastMonthEnd.year,
        month: lastMonthEnd.month,
        day: 1,
      };
      return {
        startDate: formatCalendarPartsISO(lastMonthStart),
        endDate: formatCalendarPartsISO(lastMonthEnd),
      };
    }
    default: {
      const date = formatCalendarPartsISO(today);
      return { startDate: date, endDate: date };
    }
  }
}

export function formatBDT(dateInput: string | Date, pattern: string): string {
  return formatInTimeZone(normalizeDateInput(dateInput), BDT_TIME_ZONE, pattern);
}

export function getInclusiveEndDateFromExclusiveUTC(dateInput: string | Date): Date {
  return new Date(normalizeDateInput(dateInput).getTime() - 1);
}
