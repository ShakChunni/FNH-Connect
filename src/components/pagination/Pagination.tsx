"use client";

import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults?: number;
  startIndex?: number;
  endIndex?: number;
  onPageChange: (page: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  showResultsText?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalResults,
  startIndex,
  endIndex,
  onPageChange,
  onPrev,
  onNext,
  showResultsText = true,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  // Calculate visible pages with ellipsis
  const getVisiblePages = (): (number | string)[] => {
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
  };

  const visiblePages = getVisiblePages();
  const handlePrev =
    onPrev || (() => onPageChange(Math.max(1, currentPage - 1)));
  const handleNext =
    onNext || (() => onPageChange(Math.min(totalPages, currentPage + 1)));

  return (
    <div className="flex flex-col gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 text-sm font-medium text-gray-500">
      {showResultsText &&
        (totalResults !== undefined || startIndex !== undefined) && (
          <p className="text-xs text-gray-500">
            {totalResults !== undefined &&
            startIndex !== undefined &&
            endIndex !== undefined
              ? totalResults === 0
                ? "Showing 0 results"
                : `Showing ${startIndex} to ${endIndex} of ${totalResults} results`
              : totalResults !== undefined
              ? totalResults === 0
                ? "Showing 0 results"
                : `${totalResults} total results`
              : null}
          </p>
        )}
      <nav
        className="flex items-center justify-center md:justify-end gap-1.5"
        aria-label="Pagination"
      >
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => {
            handlePrev();
            window.scrollTo({ top: 100, behavior: "smooth" });
          }}
          disabled={currentPage === 1}
          className={cn(
            "flex h-9 items-center rounded-xl border px-3 md:px-4 text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
            currentPage === 1
              ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
              : "bg-white border-gray-200 text-fnh-navy hover:bg-fnh-navy hover:text-white hover:border-fnh-navy"
          )}
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">←</span>
        </button>

        {/* Page Numbers */}
        {visiblePages.map((page, index) =>
          typeof page === "number" ? (
            <button
              key={`page-${page}-${index}`}
              type="button"
              onClick={() => {
                onPageChange(page);
                window.scrollTo({ top: 100, behavior: "smooth" });
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer",
                page === currentPage
                  ? "border-fnh-navy bg-fnh-navy text-white shadow-md"
                  : "border-gray-200 bg-white text-fnh-navy-dark hover:bg-fnh-navy/10 hover:border-fnh-navy"
              )}
            >
              {page}
            </button>
          ) : (
            <span
              key={`ellipsis-${index}`}
              className="flex h-9 w-9 items-center justify-center text-xs md:text-sm font-semibold text-gray-400"
            >
              {page}
            </span>
          )
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => {
            handleNext();
            window.scrollTo({ top: 100, behavior: "smooth" });
          }}
          disabled={currentPage === totalPages || totalResults === 0}
          className={cn(
            "flex h-9 items-center rounded-xl border px-3 md:px-4 text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
            currentPage === totalPages || totalResults === 0
              ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
              : "bg-white border-gray-200 text-fnh-navy hover:bg-fnh-navy hover:text-white hover:border-fnh-navy"
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">→</span>
        </button>
      </nav>
    </div>
  );
}
