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

interface SidebarStateContextValue extends SidebarState {
  setSidebarState: (expanded: boolean) => void;
  setPinnedState: (pinned: boolean) => void;
  toggleSection: (sectionId: string) => void;
}

const SidebarStateContext = createContext<SidebarStateContextValue | null>(
  null
);

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SidebarState>(() => getInitialState());

  useEffect(() => {
    setState(getInitialState());
  }, []);

  const setSidebarState = useCallback((expanded: boolean) => {
    setState((prev) => {
      if (prev.isExpanded === expanded) {
        return prev;
      }

      const nextState = { ...prev, isExpanded: expanded };

      if (typeof window !== "undefined") {
        localStorage.setItem("isExpanded", JSON.stringify(expanded));
      }

      return nextState;
    });
  }, []);

  const setPinnedState = useCallback((pinned: boolean) => {
    setState((prev) => {
      if (prev.isPinned === pinned) {
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

  const contextValue = useMemo<SidebarStateContextValue>(
    () => ({
      isExpanded: state.isExpanded,
      isPinned: state.isPinned,
      isAnimating: state.isAnimating,
      expandedSections: state.expandedSections,
      setSidebarState,
      setPinnedState,
      toggleSection,
    }),
    [
      state.isExpanded,
      state.isPinned,
      state.isAnimating,
      state.expandedSections,
      setSidebarState,
      setPinnedState,
      toggleSection,
    ]
  );

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
