import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildVisiblePages(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  // Always show first page
  pages.push(1);

  // Add left ellipsis if needed
  if (currentPage > 3) {
    pages.push("...");
  }

  // Add left siblings (pages before current)
  const leftStart = Math.max(2, currentPage - 1);
  const leftEnd = currentPage - 1;
  for (let i = leftStart; i <= leftEnd; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Add current page (if not already added)
  if (currentPage !== 1 && currentPage !== totalPages) {
    pages.push(currentPage);
  }

  // Add right siblings (pages after current)
  const rightStart = currentPage + 1;
  const rightEnd = Math.min(totalPages - 1, currentPage + 1);
  for (let i = rightStart; i <= rightEnd; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Add right ellipsis if needed
  if (currentPage < totalPages - 2) {
    pages.push("...");
  }

  // Always show last page (if not already added)
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return pages;
}

export function buildPaginationMeta(
  totalResults: number,
  currentPage: number,
  pageSize: number,
  itemsPerPage: number
) {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalResults);
  return {
    startIndex,
    endIndex,
    totalResults,
    currentPage,
    pageSize,
    totalPages: Math.ceil(totalResults / pageSize),
  };
}
