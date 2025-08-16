import React from "react";
import { SearchIcon } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative">
      <input
        type="text"
        class
        Name="bg-gray-200 text-gray-700 rounded-xl py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-blue-900 w-full sm:w-48 md:w-64 lg:w-80"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
    </div>
  );
};

export default SearchBar;
