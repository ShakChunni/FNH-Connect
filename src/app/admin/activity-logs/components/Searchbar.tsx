import React, { useState, useCallback, useEffect } from "react";
import { SearchIcon } from "lucide-react";

interface SearchbarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

const Searchbar: React.FC<SearchbarProps> = ({
  onSearch,
  initialValue = "",
}) => {
  const [query, setQuery] = useState(initialValue);

  // Update local state when initialValue prop changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Search"
        className="bg-white text-gray-700 rounded-xl py-3 px-4 pl-10 pr-10 
                  border border-gray-200 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-blue-950 
                  w-full
                  transition-all duration-300"
        style={{
          height: "50px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      />
      <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />

      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 
                    hover:text-gray-600 focus:outline-none transition-colors duration-200"
          aria-label="Clear search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
};

export default Searchbar;
