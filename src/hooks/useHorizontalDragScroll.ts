import { useRef, useCallback, useEffect } from "react";

/**
 * Hook to enable horizontal drag-to-scroll on a container element.
 * Works with mouse hold + drag (like touch scrolling but with mouse).
 *
 * @returns Ref to attach to the scrollable container and event handlers
 */
export function useHorizontalDragScroll<
  T extends HTMLElement = HTMLDivElement
>() {
  const containerRef = useRef<T>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // Only start drag if clicking on the container or table (not on interactive elements)
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("[role='button']")
    ) {
      return;
    }

    isDragging.current = true;
    startX.current = e.pageX - container.offsetLeft;
    scrollLeft.current = container.scrollLeft;
    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
  }, []);

  const handleMouseUp = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    isDragging.current = false;
    container.style.cursor = "grab";
    container.style.userSelect = "";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Multiply for faster scroll
    container.scrollLeft = scrollLeft.current - walk;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    isDragging.current = false;
    container.style.cursor = "grab";
    container.style.userSelect = "";
  }, []);

  // Set initial cursor style
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.style.cursor = "grab";
    }
  }, []);

  return {
    ref: containerRef,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}

export default useHorizontalDragScroll;
