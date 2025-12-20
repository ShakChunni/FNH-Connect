import { RefObject, useEffect, useState, useRef } from "react";

/**
 * Hook for dynamically positioning dropdown portals relative to their trigger button.
 * Handles:
 * - Automatic positioning above/below based on available space
 * - Closing on outside scroll
 * - Repositioning on window resize
 * 
 * Uses a ref for onClose to prevent effect re-runs when the callback changes.
 * This fixes issues where inline callbacks like `onClose={() => setIsOpen(false)}`
 * would cause the effect to constantly re-run and create race conditions.
 */
export const useDynamicDropdownPosition = (
  isOpen: boolean,
  buttonRef: RefObject<HTMLElement | null>,
  dropdownRef: RefObject<HTMLElement | null>,
  onClose: () => void
) => {
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({
    // Start with opacity 0 to prevent flicker
    opacity: 0,
  });
  const [animationDirection, setAnimationDirection] = useState<"up" | "down">(
    "down"
  );

  // Store onClose in a ref so it doesn't trigger effect re-runs
  // This allows consumers to pass inline functions without causing issues
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      // Reset to initial state when closed to avoid showing old position on reopen
      setPositionStyle({ opacity: 0 });
      return;
    }

    // Small delay to debounce scroll events that fire during the click
    // This prevents the dropdown from closing immediately due to layout shifts
    const SCROLL_DEBOUNCE_MS = 100;
    const openedAt = Date.now();

    const updatePosition = () => {
      if (!buttonRef.current || !dropdownRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;

      if (dropdownHeight === 0) return;

      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const verticalOffset = 8;

      let top, left, width;
      left = buttonRect.left + window.scrollX;
      width = buttonRect.width;

      if (spaceBelow >= dropdownHeight) {
        top = buttonRect.bottom + window.scrollY + verticalOffset;
        setAnimationDirection("down");
      } else {
        top = buttonRect.top + window.scrollY - dropdownHeight - verticalOffset;
        setAnimationDirection("up");
      }

      setPositionStyle({
        position: "absolute" as const,
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        // Keep dropdowns above most UI layers; this zIndex must be less than
        // the modal overlay if the overlay intentionally sits above dropdowns.
        // For AddNewData modal we need portals to render above it, DropdownPortal
        // overrides this inline value when needed.
        zIndex: 110000,
        opacity: 1,
      });
    };

    const observer = new ResizeObserver(updatePosition);
    if (dropdownRef.current) {
      observer.observe(dropdownRef.current);
    }

    const handleScroll = (event: Event) => {
      // Debounce: ignore scroll events that fire immediately after opening
      // This prevents accidental close from micro-scrolls during click
      if (Date.now() - openedAt < SCROLL_DEBOUNCE_MS) {
        return;
      }

      // Don't close if scrolling inside the dropdown
      if (
        !dropdownRef.current ||
        dropdownRef.current.contains(event.target as Node)
      ) {
        return;
      }

      // Don't close if scrolling on the button itself
      if (buttonRef.current?.contains(event.target as Node)) {
        return;
      }

      // Use the ref to always call the latest onClose
      onCloseRef.current();
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      if (dropdownRef.current) {
        observer.unobserve(dropdownRef.current);
      }
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, buttonRef, dropdownRef]); // Note: onClose removed from deps - we use the ref instead

  return { positionStyle, animationDirection };
};
