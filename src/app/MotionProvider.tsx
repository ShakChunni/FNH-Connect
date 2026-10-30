"use client";

import { useEffect } from "react";
import { MotionGlobalConfig } from "framer-motion";

/** Framer animations are skipped entirely under the OS "reduce motion" setting. */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      MotionGlobalConfig.skipAnimations = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return <>{children}</>;
}
