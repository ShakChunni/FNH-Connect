export const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

function formatPartsAsISO(parts: DateParts): string {
  return `${parts.year}-${padTwo(parts.month)}-${padTwo(parts.day)}`;
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days),
  );
}

function formatUTCDateAsISO(date: Date): string {
  return formatPartsAsISO({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

function getTodayBDTDateUTC(reference: Date = new Date()): Date {
  const bdtNow = new Date(reference.getTime() + BDT_OFFSET_MS);
  return new Date(
    Date.UTC(
      bdtNow.getUTCFullYear(),
      bdtNow.getUTCMonth(),
      bdtNow.getUTCDate(),
    ),
  );
}

export function formatCalendarDateISO(date: Date): string {
  return formatPartsAsISO({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

export function getBDTDateRangeFromPreset(preset: "today" | "yesterday" | "lastWeek" | "lastMonth"): {
  startDate: string;
  endDate: string;
} {
  const todayBDTUTC = getTodayBDTDateUTC();

  switch (preset) {
    case "today": {
      const date = formatUTCDateAsISO(todayBDTUTC);
      return { startDate: date, endDate: date };
    }
    case "yesterday": {
      const yesterday = addDaysUTC(todayBDTUTC, -1);
      const date = formatUTCDateAsISO(yesterday);
      return { startDate: date, endDate: date };
    }
    case "lastWeek": {
      const currentWeekDay = todayBDTUTC.getUTCDay(); // Sunday=0
      const currentWeekStart = addDaysUTC(todayBDTUTC, -currentWeekDay);
      const lastWeekStart = addDaysUTC(currentWeekStart, -7);
      const lastWeekEnd = addDaysUTC(currentWeekStart, -1);
      return {
        startDate: formatUTCDateAsISO(lastWeekStart),
        endDate: formatUTCDateAsISO(lastWeekEnd),
      };
    }
    case "lastMonth": {
      const thisMonthStart = new Date(
        Date.UTC(todayBDTUTC.getUTCFullYear(), todayBDTUTC.getUTCMonth(), 1),
      );
      const lastMonthEnd = addDaysUTC(thisMonthStart, -1);
      const lastMonthStart = new Date(
        Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth(), 1),
      );
      return {
        startDate: formatUTCDateAsISO(lastMonthStart),
        endDate: formatUTCDateAsISO(lastMonthEnd),
      };
    }
    default: {
      const date = formatUTCDateAsISO(todayBDTUTC);
      return { startDate: date, endDate: date };
    }
  }
}
