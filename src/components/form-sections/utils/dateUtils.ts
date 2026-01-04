/**
 * Date and Age Calculation Utilities
 * Centralized functions for calculating age from DOB across the application
 */

import type { AgeInfo } from "../../../app/(authenticated)/infertility/types";

/**
 * Calculate age in years, months, and days from a date of birth
 * Returns null if DOB is invalid or not provided
 */
export function calculateAgeInfo(
  dateOfBirth: Date | string | null | undefined
): AgeInfo | null {
  if (!dateOfBirth) {
    return null;
  }

  try {
    const dob =
      dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);

    if (isNaN(dob.getTime())) {
      return null;
    }

    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      const prevMonthDate = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonthDate.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  } catch {
    return null;
  }
}

/**
 * Get age in years (rounded down) from a date of birth
 * This is useful for display purposes where we just need a single age number
 */
export function getAgeInYears(
  dateOfBirth: Date | string | null | undefined
): number | null {
  const ageInfo = calculateAgeInfo(dateOfBirth);
  return ageInfo ? ageInfo.years : null;
}

/**
 * Format age info into a readable string
 * Example: "25 years, 3 months, 15 days"
 */
export function formatAgeInfo(ageInfo: AgeInfo | null): string {
  if (!ageInfo) {
    return "N/A";
  }

  const parts: string[] = [];
  if (ageInfo.years > 0) {
    parts.push(`${ageInfo.years} year${ageInfo.years !== 1 ? "s" : ""}`);
  }
  if (ageInfo.months > 0) {
    parts.push(`${ageInfo.months} month${ageInfo.months !== 1 ? "s" : ""}`);
  }
  if (ageInfo.days > 0) {
    parts.push(`${ageInfo.days} day${ageInfo.days !== 1 ? "s" : ""}`);
  }

  return parts.length > 0 ? parts.join(", ") : "0 days";
}

/**
 * Format a date into a readable string (e.g., "Jan 15, 2000")
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return "N/A";
  }

  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
      return "N/A";
    }
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

/**
 * Format a date for input fields (ISO 8601 format: YYYY-MM-DD)
 */
export function formatDateForInput(
  date: Date | string | null | undefined
): string {
  if (!date) {
    return "";
  }

  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
      return "";
    }
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}
