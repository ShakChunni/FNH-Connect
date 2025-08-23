import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0 && container.scrollTop === 0) {
        e.preventDefault();
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);

        // Haptic feedback for mobile web (if supported)
        if (distance >= threshold && "vibrate" in navigator) {
          navigator.vibrate(50);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging.current) return;

      isDragging.current = false;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);

        // Haptic feedback for mobile web
        if ("vibrate" in navigator) {
          navigator.vibrate(100);
        }

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
    };

    // Mouse events for desktop testing
    const handleMouseDown = (e: MouseEvent) => {
      if (container.scrollTop === 0 && !isRefreshing) {
        startY.current = e.clientY;
        isDragging.current = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || isRefreshing) return;

      currentY.current = e.clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0 && container.scrollTop === 0) {
        e.preventDefault();
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);
      }
    };

    const handleMouseUp = async () => {
      if (!isDragging.current) return;

      isDragging.current = false;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
    };

    // Touch events
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);

    // Mouse events for desktop testing
    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pullDistance, threshold, resistance, isRefreshing, onRefresh]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isPulling: pullDistance > 0,
  };
};
