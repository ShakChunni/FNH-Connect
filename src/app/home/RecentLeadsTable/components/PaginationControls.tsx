import { FC } from "react";
import { Button, Flex } from "@radix-ui/themes";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"; // Import icons

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
}

const PaginationControls: FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onPageChange,
}) => {
  const renderPageNumbers = () => {
    const pages = [];

    pages.push(1);

    if (currentPage > 5) {
      pages.push("...");
    }

    const startPage = Math.max(2, currentPage - 4);
    const endPage = Math.min(totalPages - 1, currentPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 4) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (page === "...") {
        return (
          <span key={index} className="px-2">
            ...
          </span>
        );
      }

      return (
        <Button
          key={index}
          onClick={() => onPageChange(page as number)}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 ease-in-out ${
            page === currentPage
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-950 hover:bg-blue-900 cursor-pointer"
          } text-white`}
        >
          {page}
        </Button>
      );
    });
  };

  return (
    <Flex justify={"center"} gap={"8px"} align={"center"} className="flex-wrap">
      <Button
        disabled={currentPage === 1}
        onClick={onPreviousPage}
        className={`py-2 px-4 rounded-2xl transition-colors duration-300 ease-in-out ${
          currentPage === 1
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-950 hover:bg-blue-900 cursor-pointer"
        } text-white`}
      >
        <FaArrowLeft /> {/* Use icon */}
      </Button>

      {renderPageNumbers()}

      <Button
        disabled={currentPage === totalPages}
        onClick={onNextPage}
        className={`py-2 px-4 rounded-2xl transition-colors duration-300 ease-in-out ${
          currentPage === totalPages
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-950 hover:bg-blue-900 cursor-pointer"
        } text-white`}
      >
        <FaArrowRight /> {/* Use icon */}
      </Button>
    </Flex>
  );
};

export default PaginationControls;
