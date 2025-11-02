import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ExpandedSections = Record<string, boolean>;

interface SidebarState {
  isExpanded: boolean;
  isPinned: boolean;
  isAnimating: boolean;
  expandedSections: ExpandedSections;
}

// FIXED: Consistent default state for both server and client
const DEFAULT_STATE: SidebarState = {
  isExpanded: false,
  isPinned: false,
  isAnimating: false,
  expandedSections: { dashboards: true },
};

const getClientState = (): SidebarState => {
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
    return DEFAULT_STATE;
  }
};

interface SidebarStateContextValue extends SidebarState {
  isHydrated: boolean;
  setSidebarState: (expanded: boolean) => void;
  setPinnedState: (pinned: boolean) => void;
  toggleSection: (sectionId: string) => void;
}

const SidebarStateContext = createContext<SidebarStateContextValue | null>(
  null
);

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  // Start with null state to indicate "not ready yet"
  const [state, setState] = useState<SidebarState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read localStorage immediately after mount - this is the REAL initial state
  useEffect(() => {
    const clientState = getClientState();
    setState(clientState);
    setIsHydrated(true);
  }, []);

  const setSidebarState = useCallback((expanded: boolean) => {
    setState((prev) => {
      if (!prev || prev.isExpanded === expanded) {
        return prev;
      }

      const nextState: SidebarState = { ...prev, isExpanded: expanded };

      if (typeof window !== "undefined") {
        localStorage.setItem("isExpanded", JSON.stringify(expanded));
      }

      return nextState;
    });
  }, []);

  const setPinnedState = useCallback((pinned: boolean) => {
    setState((prev) => {
      if (!prev || prev.isPinned === pinned) {
        return prev;
      }

      const nextState: SidebarState = {
        ...prev,
        isPinned: pinned,
        isExpanded: pinned ? true : prev.isExpanded,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("isPinned", JSON.stringify(pinned));
        if (pinned) {
          localStorage.setItem("isExpanded", JSON.stringify(true));
        }
      }

      return nextState;
    });
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setState((prev) => {
      if (!prev) return prev;

      const expandedSections: ExpandedSections = {
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

  // Don't render context until state is ready
  if (!state || !isHydrated) {
    return null;
  }

  const contextValue: SidebarStateContextValue = {
    isExpanded: state.isExpanded,
    isPinned: state.isPinned,
    isAnimating: state.isAnimating,
    expandedSections: state.expandedSections,
    isHydrated,
    setSidebarState,
    setPinnedState,
    toggleSection,
  };

  return createElement(
    SidebarStateContext.Provider,
    { value: contextValue },
    children
  );
}

const useSidebarState = () => {
  const context = useContext(SidebarStateContext);

  if (context === null) {
    throw new Error(
      "useSidebarState must be used within a SidebarStateProvider"
    );
  }

  return context;
};

export default useSidebarState;
