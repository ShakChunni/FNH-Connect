import React from "react";
import { Flex } from "@radix-ui/themes";
import PaginationControls from "./PaginationControls";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
  scrollToTop: () => void; // Add scrollToTop prop
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onPageChange,
  scrollToTop, // Destructure scrollToTop
}) => (
  <Flex className="justify-center mb-5 px-4 sm:px-0">
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      onPreviousPage={onPreviousPage}
      onNextPage={onNextPage}
      onPageChange={(page) => {
        onPageChange(page);
        scrollToTop(); // Call scrollToTop when page changes
      }}
    />
  </Flex>
);

export default Pagination;
