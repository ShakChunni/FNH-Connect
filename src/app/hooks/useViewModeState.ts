import { useState, useCallback } from "react";

type ViewMode = "grid" | "list";

interface UseViewModeStateResult {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const getInitialViewMode = (): ViewMode => {
  if (typeof window === "undefined") {
    return "grid"; // Default to grid view on server
  }

  const savedViewMode = localStorage.getItem("goalsViewMode");
  return (savedViewMode === "list" ? "list" : "grid") as ViewMode;
};

const useViewModeState = (): UseViewModeStateResult => {
  const [viewMode, setViewModeState] = useState<ViewMode>(getInitialViewMode);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);

    if (typeof window !== "undefined") {
      localStorage.setItem("goalsViewMode", mode);
    }
  }, []);

  return {
    viewMode,
    setViewMode,
  };
};

export default useViewModeState;
