import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox, Text } from "@radix-ui/themes";

interface AssigneeSelectorProps {
  selectedTeams: string[];
  selectedMembers: string[];
  onSelectTeam: (value: string) => void;
  onSelectMember: (value: string) => void;
}


const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  selectedTeams,
  selectedMembers,
  onSelectTeam,
  onSelectMember,
}) => {
  const getMemberPlaceholder = () => {
    if (selectedTeams.length > 0 && selectedMembers.length === 0) {
      return `All members of ${selectedTeams.join(", ")}`;
    }
    return "Select";
  };

  return (
    <div className="flex items-center space-x-4">
      <strong className="text-black w-32">Assignee:</strong>
      <div className="flex flex-1 space-x-4">
        <Dropdown
          options={["team1", "team2", "team3"]}
          selectedValues={selectedTeams}
          placeholder="Select Team"
          onSelect={onSelectTeam}
        />
        <Dropdown
          options={["member1", "member2", "member3", "member4"]}
          selectedValues={selectedMembers}
          placeholder={getMemberPlaceholder()}
          onSelect={onSelectMember}
        />
      </div>
    </div>
  );
};

const Dropdown: React.FC<{
  options: string[];
  selectedValues: string[];
  placeholder?: string;
  onSelect: (value: string) => void;
}> = ({ options, selectedValues, placeholder, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    },
    [dropdownRef]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  return (
    <div ref={dropdownRef} className="relative flex-1">
      <button
        className={`${
          selectedValues.length
            ? "bg-white border border-green-500"
            : "bg-[#F0F4F8] border border-gray-200"
        } text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 outline-none shadow-sm hover:shadow-md transition-shadow duration-300`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedValues.length ? selectedValues.join(", ") : placeholder}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 w-full"
          >
            {options.map((option) => (
              <div
                key={option}
                onClick={() => onSelect(option)}
                className="cursor-pointer px-4 py-3 hover:bg-violet-600 hover:text-white hover:rounded-lg flex items-center"
              >
                <Checkbox
                  checked={selectedValues.includes(option)}
                  onCheckedChange={() => onSelect(option)}
                  className="mr-2"
                />
                <Text>{option}</Text>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssigneeSelector;
