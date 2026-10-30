"use client";

import { MotionConfig } from "framer-motion";

/** Framer animations follow the OS "reduce motion" setting app-wide. */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
