import { useEffect } from "react";

export const usePreventUnload = () => {
  const enablePreventUnload = () => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages
      return (e.returnValue = "");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  };

  const disablePreventUnload = () => {
    window.onbeforeunload = null;
  };

  return { enablePreventUnload, disablePreventUnload };
};
