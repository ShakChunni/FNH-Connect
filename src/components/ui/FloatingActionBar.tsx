"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCheck, ChevronDown, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FloatingAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "ghost" | "warning";
  disabled?: boolean;
}

interface FloatingActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onUnselectAll?: () => void;
  isSelectAllMode?: boolean;
  actions?: FloatingAction[];
  className?: string;
  /** Label for what is selected (e.g., "card", "employee"). Defaults to item/items */
  itemLabel?: string;
}

export function FloatingActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onUnselectAll,
  isSelectAllMode,
  actions = [],
  className,
  itemLabel,
}: FloatingActionBarProps) {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Only show when there's a selection
  const shouldShow = selectedCount > 0 || isSelectAllMode;

  // Determine if we should show "Select All Pages"
  const showSelectAll =
    onSelectAll &&
    totalCount &&
    selectedCount > 0 &&
    !isSelectAllMode &&
    totalCount > selectedCount;

  // Show "Unselect All" when in select all pages mode
  const showUnselectAll = isSelectAllMode && onUnselectAll;

  const showMiddleSection = showSelectAll || showUnselectAll;

  // Generate the proper label for selected items
  const getSelectedLabel = () => {
    if (itemLabel) {
      return selectedCount === 1 ? itemLabel : `${itemLabel}s`;
    }
    return selectedCount === 1 ? "item" : "items";
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {shouldShow && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
          <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{
              layout: { duration: 0.2, ease: "easeOut" },
              opacity: { duration: 0.2 },
              y: { type: "spring", stiffness: 300, damping: 30 },
              scale: { type: "spring", stiffness: 300, damping: 30 },
            }}
            className={cn(
              "pointer-events-auto flex items-center px-2 py-2",
              "bg-fnh-navy-dark/95 backdrop-blur-xl",
              "border border-fnh-grey/30",
              "rounded-full shadow-[0_16px_48px_rgba(0,0,0,0.4)]",
              className
            )}
          >
            {/* Selection Count Badge */}
            <div className="flex items-center gap-2.5 pl-2 pr-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center bg-fnh-blue text-white font-bold rounded-full min-w-[30px] h-[30px] px-2.5 text-sm shadow-sm">
                  {selectedCount}
                </span>
                <span className="text-sm font-medium text-white whitespace-nowrap">
                  <span className="hidden sm:inline">
                    {getSelectedLabel()} selected
                  </span>
                  <span className="sm:hidden">selected</span>
                </span>
              </div>
              <button
                onClick={onClearSelection}
                className="p-2 rounded-full text-fnh-grey hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Select/Unselect All Option - Collapsible */}
            <motion.div
              initial={false}
              animate={{
                width: showMiddleSection ? "auto" : 0,
                opacity: showMiddleSection ? 1 : 0,
              }}
              transition={{
                width: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2, ease: "easeOut" },
              }}
              className="overflow-hidden flex items-center"
            >
              <div className="flex items-center">
                <AnimatePresence mode="wait" initial={false}>
                  {showSelectAll && (
                    <motion.button
                      key="select-all"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      onClick={onSelectAll}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-fnh-blue hover:bg-fnh-blue/10 rounded-full transition-colors duration-200 whitespace-nowrap cursor-pointer"
                    >
                      <CheckCheck className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">
                        Select all {totalCount}
                      </span>
                      <span className="sm:hidden">All {totalCount}</span>
                    </motion.button>
                  )}
                  {showUnselectAll && (
                    <motion.button
                      key="unselect-all"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      onClick={onUnselectAll}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-fnh-grey hover:text-white hover:bg-white/10 rounded-full transition-colors duration-200 whitespace-nowrap cursor-pointer"
                    >
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Unselect all</span>
                      <span className="sm:hidden">Unselect</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Divider 1 */}
            <div className="w-px h-7 bg-fnh-grey/30 mx-2" />

            {/* Actions Dropdown */}
            <div className="relative pr-1">
              <button
                ref={menuButtonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer",
                  "bg-fnh-blue text-white",
                  "hover:bg-fnh-blue-light",
                  "active:scale-[0.97]"
                )}
              >
                Actions
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                    className={cn(
                      "absolute bottom-full right-0 mb-2.5 min-w-[200px]",
                      "bg-fnh-navy-dark border border-fnh-grey/30",
                      "rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] overflow-hidden"
                    )}
                  >
                    <div className="py-2">
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            action.onClick();
                            setIsMenuOpen(false);
                          }}
                          disabled={action.disabled}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap",
                            action.variant === "destructive" && [
                              "text-red-400",
                              "hover:bg-red-500/20 hover:text-red-300",
                            ],
                            action.variant === "warning" && [
                              "text-amber-400",
                              "hover:bg-amber-500/20 hover:text-amber-300",
                            ],
                            (!action.variant ||
                              action.variant === "default") && [
                              "text-white",
                              "hover:bg-fnh-blue/20 hover:text-fnh-blue-light",
                            ],
                            action.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {action.icon && (
                            <span className="shrink-0">{action.icon}</span>
                          )}
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
