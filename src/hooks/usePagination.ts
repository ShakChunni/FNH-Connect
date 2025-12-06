"use client";

import { useState, useEffect, useMemo } from "react";
import { buildVisiblePages, buildPaginationMeta } from "@/lib/utils";

interface UsePaginationProps {
  totalResults: number;
  pageSize: number;
  initialPage?: number;
  resetOn?: unknown[];
}

export function usePagination({
  totalResults,
  pageSize,
  initialPage = 1,
  resetOn = [],
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  const visiblePages = useMemo(
    () => buildVisiblePages(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const paginationMeta = useMemo(
    () => buildPaginationMeta(totalResults, currentPage, pageSize, pageSize),
    [totalResults, currentPage, pageSize]
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetOn);

  // Ensure current page doesn't exceed total pages
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPrev = () => {
    goToPage(currentPage - 1);
  };

  const goToNext = () => {
    goToPage(currentPage + 1);
  };

  const goToFirst = () => {
    goToPage(1);
  };

  const goToLast = () => {
    goToPage(totalPages);
  };

  return {
    currentPage,
    totalPages,
    visiblePages,
    paginationMeta,
    goToPage,
    goToPrev,
    goToNext,
    goToFirst,
    goToLast,
  };
}
