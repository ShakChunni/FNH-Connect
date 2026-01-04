"use client";

import React, { useState, useRef } from "react";
import { ChevronDown, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface UserFilterOption {
  id: number;
  username: string;
  fullName: string;
}

interface UserFilterProps {
  users: UserFilterOption[];
  currentUserId: number | null;
  onUserChange: (userId: number | null) => void;
  disabled?: boolean;
}

const UserFilter: React.FC<UserFilterProps> = ({
  users,
  currentUserId,
  onUserChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSelect = (userId: number | null) => {
    onUserChange(userId);
    setIsOpen(false);
  };

  const selectedUser = users.find((u) => u.id === currentUserId);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 w-full sm:w-[140px]",
          "bg-gray-50/50 border border-gray-100 rounded-xl",
          "text-[10px] sm:text-xs font-bold",
          "focus:outline-none focus:ring-2 focus:ring-fnh-blue/20",
          "transition-all duration-200 cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-2 ring-fnh-blue/20"
        )}
      >
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="truncate">
            {selectedUser ? selectedUser.fullName : "All Users"}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-3 h-3 text-gray-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[180px] max-w-[220px]"
      >
        <div className="py-1 max-h-[320px] overflow-y-auto">
          {/* All Users Option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2 text-left",
              "text-[10px] sm:text-xs font-medium",
              "hover:bg-gray-50 transition-colors cursor-pointer",
              currentUserId === null && "bg-fnh-blue/5"
            )}
          >
            <span className={currentUserId === null ? "font-bold" : ""}>
              All Users
            </span>
            {currentUserId === null && (
              <Check className="w-3.5 h-3.5 text-fnh-blue shrink-0" />
            )}
          </button>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-1" />

          {/* User Options */}
          {users.map((user) => {
            const isSelected = user.id === currentUserId;

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-left",
                  "text-[10px] sm:text-xs",
                  "hover:bg-gray-50 transition-colors cursor-pointer",
                  isSelected && "bg-fnh-blue/5"
                )}
              >
                <div className="min-w-0">
                  <p className={cn("truncate", isSelected && "font-bold")}>
                    {user.fullName}
                  </p>
                  <p className="text-[8px] text-gray-400 truncate">
                    @{user.username}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-fnh-blue shrink-0" />
                )}
              </button>
            );
          })}

          {users.length === 0 && (
            <div className="px-3 py-4 text-center text-[10px] text-gray-400">
              No users found
            </div>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default UserFilter;
