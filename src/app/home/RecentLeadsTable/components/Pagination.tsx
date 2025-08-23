import React from "react";
import PaginationControls from "./PaginationControls";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
  scrollToTop: () => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onPageChange,
  scrollToTop,
}) => (
  <div className="flex justify-center items-center mt-6 px-4 sm:px-0 w-full">
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      onPreviousPage={() => {
        onPreviousPage();
        scrollToTop();
      }}
      onNextPage={() => {
        onNextPage();
        scrollToTop();
      }}
      onPageChange={(page) => {
        onPageChange(page);
        scrollToTop();
      }}
    />
  </div>
);

export default Pagination;
