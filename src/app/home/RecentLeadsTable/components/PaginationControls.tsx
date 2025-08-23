import { FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
          <span key={index} className="px-2 text-gray-500">
            ...
          </span>
        );
      }

      return (
        <button
          key={index}
          onClick={() => onPageChange(page as number)}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-in-out font-medium ${
            page === currentPage
              ? "bg-gray-400 cursor-not-allowed text-white shadow-sm"
              : "bg-blue-950 hover:bg-blue-900 cursor-pointer text-white shadow-lg hover:shadow-xl transform hover:scale-105"
          }`}
          disabled={page === currentPage}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="flex justify-center items-center gap-3 flex-wrap w-full">
      <button
        disabled={currentPage === 1}
        onClick={onPreviousPage}
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-in-out ${
          currentPage === 1
            ? "bg-gray-400 cursor-not-allowed text-white shadow-sm"
            : "bg-blue-950 hover:bg-blue-900 cursor-pointer text-white shadow-lg hover:shadow-xl transform hover:scale-105"
        }`}
      >
        <ChevronLeft size={18} />
      </button>

      {renderPageNumbers()}

      <button
        disabled={currentPage === totalPages}
        onClick={onNextPage}
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-in-out ${
          currentPage === totalPages
            ? "bg-gray-400 cursor-not-allowed text-white shadow-sm"
            : "bg-blue-950 hover:bg-blue-900 cursor-pointer text-white shadow-lg hover:shadow-xl transform hover:scale-105"
        }`}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
export default PaginationControls;