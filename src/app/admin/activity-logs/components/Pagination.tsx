import React from "react";
import { Flex } from "@radix-ui/themes";
import PaginationControls from "./PaginationControl";

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
  
  scrollToTop,
}) => (
  <Flex className="justify-center mt-4 mb-5">
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      onPreviousPage={() => {
        onPreviousPage();
        scrollToTop(); // Call scrollToTop when previous page is clicked
      }}
      onNextPage={() => {
        onNextPage();
        scrollToTop(); // Call scrollToTop when next page is clicked
      }}
      onPageChange={(page) => {
        onPageChange(page);
        scrollToTop(); // Call scrollToTop when page changes
      }}
    />
  </Flex>
);

export default Pagination;
