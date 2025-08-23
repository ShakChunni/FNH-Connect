import { useState, useCallback, useRef, useEffect } from "react";

type ExpandedSections = Record<string, boolean>;

interface SidebarState {
  isExpanded: boolean;
  isPinned: boolean;
  isAnimating: boolean;
  expandedSections: ExpandedSections;
}

const getInitialState = (): SidebarState => {
  if (typeof window === "undefined") {
    return {
      isExpanded: false,
      isPinned: false,
      isAnimating: false,
      expandedSections: { dashboards: true },
    };
  }

  try {
    const savedPinned = localStorage.getItem("isPinned");
    const savedExpanded = localStorage.getItem("isExpanded");
    const savedSections = localStorage.getItem("expandedSections");

    const isPinned = savedPinned === "true";
    const isExpanded = isPinned ? true : savedExpanded === "true";
    const expandedSections: ExpandedSections = savedSections
      ? JSON.parse(savedSections)
      : { dashboards: true };

    return { isExpanded, isPinned, isAnimating: false, expandedSections };
  } catch (error) {
    return {
      isExpanded: false,
      isPinned: false,
      isAnimating: false,
      expandedSections: { dashboards: true },
    };
  }
};

const useSidebarState = () => {
  const [state, setState] = useState<SidebarState>(getInitialState);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

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
      if (prev.isExpanded === expanded) return prev; // Prevent unnecessary updates
      const newState = { ...prev, isExpanded: expanded };
      if (typeof window !== "undefined") {
        localStorage.setItem("isExpanded", JSON.stringify(expanded));
      }
      return newState;
    });
  }, []);

  const setPinnedState = useCallback((pinned: boolean) => {
    if (isUpdatingRef.current) {
      return;
    }

    isUpdatingRef.current = true;

    setState((prev) => {
      if (prev.isPinned === pinned) {
        isUpdatingRef.current = false;
        return prev; // Prevent unnecessary updates
      }

      const newState = {
        ...prev,
        isPinned: pinned,
        isExpanded: pinned ? true : prev.isExpanded,
        isAnimating: false,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("isPinned", JSON.stringify(pinned));
        if (pinned) {
          localStorage.setItem("isExpanded", JSON.stringify(true));
        }
      }

      // Reset the updating flag after state update
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);

      return newState;
    });
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setState((prev) => {
      const expandedSections = {
        ...prev.expandedSections,
        [sectionId]: !prev.expandedSections[sectionId],
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "expandedSections",
          JSON.stringify(expandedSections)
        );
      }
      return { ...prev, expandedSections };
    });
  }, []);

  return {
    isExpanded: state.isExpanded,
    isPinned: state.isPinned,
    isAnimating: state.isAnimating,
    expandedSections: state.expandedSections,
    setSidebarState,
    setPinnedState,
    toggleSection,
  };
};

export default useSidebarState;
