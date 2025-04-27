import { useState, useCallback, useRef, useEffect } from "react";

interface SidebarState {
  isExpanded: boolean;
  isPinned: boolean;
  isAnimating: boolean;
}

const getInitialState = (): SidebarState => {
  if (typeof window === "undefined") {
    return { isExpanded: false, isPinned: false, isAnimating: false };
  }

  const savedExpanded = localStorage.getItem("isExpanded");
  const savedPinned = localStorage.getItem("isPinned");

  const isPinned = savedPinned ? JSON.parse(savedPinned) : false;
  // Only use the saved value if it exists, otherwise default to false
  const isExpanded = savedExpanded ? JSON.parse(savedExpanded) : false;

  // Important: only expand if pinned, ignore the saved expanded state on initial load
  return { isExpanded: isPinned, isPinned, isAnimating: false };
};

const useSidebarState = () => {
  const [state, setState] = useState<SidebarState>(getInitialState);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const setSidebarState = useCallback((expanded: boolean) => {
    setState((prev) => {
      // We still want to be able to collapse sidebar when mouse leaves
      // even if the animation is still running
      const newState = { ...prev, isExpanded: expanded };
      if (typeof window !== "undefined") {
        localStorage.setItem("isExpanded", JSON.stringify(expanded));
      }
      return newState;
    });
  }, []);

  const setPinnedState = useCallback((pinned: boolean) => {
    // If we're unpinning, just run a short animation
    if (!pinned) {
      setState((prev) => ({ ...prev, isAnimating: true, isPinned: false }));

      // Just update pinned state in localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem("isPinned", "false");
      }

      // Use a shorter animation time - just enough for the icon to show rotation
      animationTimerRef.current = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          isAnimating: false,
        }));
      }, 300); // Reduced from 600ms to 300ms

      return;
    }

    // Normal pin case
    setState((prev) => {
      const newState = {
        isPinned: pinned,
        isExpanded: true,
        isAnimating: false,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("isPinned", JSON.stringify(pinned));
        localStorage.setItem("isExpanded", JSON.stringify(true));
      }
      return newState;
    });
  }, []);

  return {
    isExpanded: state.isExpanded,
    isPinned: state.isPinned,
    isAnimating: state.isAnimating,
    setSidebarState,
    setPinnedState,
  };
};

export default useSidebarState;
