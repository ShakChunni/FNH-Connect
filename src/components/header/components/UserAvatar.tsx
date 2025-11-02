"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface UserAvatarProps {
  user: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    role: string;
  };
}

const formatRoleLabel = (role?: string) => {
  if (!role) return "";
  return role
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export default function UserAvatar({ user }: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  const displayName = user.fullName;
  const roleLabel = formatRoleLabel(user.role);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 border border-fnh-grey-light bg-fnh-white/90 px-3 py-2.5 text-left shadow-[0_6px_16px_rgba(0,0,0,0.05)] transition-colors hover:border-fnh-blue/60 hover:text-fnh-navy"
        aria-label="User menu"
      >
        <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-fnh-blue to-fnh-blue-light text-sm font-semibold text-fnh-white">
          {initials}
        </div>
        <div className="hidden min-w-[8rem] flex-col text-left md:flex">
          <span className="truncate text-sm font-semibold text-fnh-navy">
            {displayName}
          </span>
          <span className="truncate text-xs text-fnh-grey">{roleLabel}</span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-fnh-grey transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden border border-fnh-grey-light bg-fnh-white shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
          <div className="bg-gradient-to-br from-fnh-navy to-fnh-navy-dark p-5 text-fnh-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-fnh-blue to-fnh-blue-light text-base font-semibold text-fnh-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-fnh-grey-light">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
