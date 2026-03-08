const BANGLADESH_TIME_ZONE = "Asia/Dhaka";
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface AgeInfo {
  years: number;
  months: number;
  days: number;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

const dhakaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BANGLADESH_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getDhakaDateParts(date: Date): DateParts | null {
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = dhakaDateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function parseDateOnlyString(value: string): DateParts | null {
  const match = DATE_ONLY_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { year, month, day };
}

function getDateParts(
  value: Date | string | null | undefined,
): DateParts | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const parsedDateOnly = parseDateOnlyString(value);

    if (parsedDateOnly) {
      return parsedDateOnly;
    }

    const parsed = new Date(value);
    return getDhakaDateParts(parsed);
  }

  return getDhakaDateParts(value);
}

function buildStableDate(parts: DateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
}

function getTodayParts(referenceDate: Date = new Date()): DateParts {
  return (
    getDhakaDateParts(referenceDate) ?? {
      year: referenceDate.getUTCFullYear(),
      month: referenceDate.getUTCMonth() + 1,
      day: referenceDate.getUTCDate(),
    }
  );
}

export function parseDateOfBirth(
  value: Date | string | null | undefined,
): Date | null {
  const parts = getDateParts(value);

  if (!parts) {
    return null;
  }

  return buildStableDate(parts);
}

export function serializeDateOfBirth(
  value: Date | string | null | undefined,
): string | null {
  const parts = getDateParts(value);

  if (!parts) {
    return null;
  }

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}

export function formatDateOfBirth(
  value: Date | string | null | undefined,
  locale: string = "en-US",
): string {
  const normalized = parseDateOfBirth(value);

  if (!normalized) {
    return "N/A";
  }

  return normalized.toLocaleDateString(locale, {
    timeZone: BANGLADESH_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function calculateAgeInfoFromDateOfBirth(
  value: Date | string | null | undefined,
  referenceDate: Date = new Date(),
): AgeInfo | null {
  const birthDate = getDateParts(value);

  if (!birthDate) {
    return null;
  }

  const today = getTodayParts(referenceDate);

  let years = today.year - birthDate.year;
  let months = today.month - birthDate.month;
  let days = today.day - birthDate.day;

  if (days < 0) {
    const previousMonth = today.month === 1 ? 12 : today.month - 1;
    const previousMonthYear =
      previousMonth === 12 ? today.year - 1 : today.year;
    const previousMonthDays = new Date(
      Date.UTC(previousMonthYear, previousMonth, 0, 12, 0, 0),
    ).getUTCDate();

    days += previousMonthDays;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days };
}

export function getAgeInYearsFromDateOfBirth(
  value: Date | string | null | undefined,
  referenceDate: Date = new Date(),
): number | null {
  return calculateAgeInfoFromDateOfBirth(value, referenceDate)?.years ?? null;
}

export function composeDateOfBirthFromAge(
  age: {
    years: number;
    months: number;
    days: number;
  },
  referenceDate: Date = new Date(),
): Date {
  const today = getTodayParts(referenceDate);
  const baseDate = buildStableDate(today);

  baseDate.setUTCFullYear(baseDate.getUTCFullYear() - age.years);
  baseDate.setUTCMonth(baseDate.getUTCMonth() - age.months);
  baseDate.setUTCDate(baseDate.getUTCDate() - age.days);

  return baseDate;
}
