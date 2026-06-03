"use client";

import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/hooks/useMounted";

/**
 * ClientPortal
 *
 * Renders children into a React portal on the client only.
 * Safely avoids hydration mismatches by returning `null` until
 * the component has mounted.
 *
 * Usage:
 *   <ClientPortal>
 *     <MyModal />
 *   </ClientPortal>
 *
 * Or with a custom container:
 *   <ClientPortal container={modalRootRef.current}>
 *     <MyModal />
 *   </ClientPortal>
 */
export function ClientPortal({
  children,
  container,
}: {
  children: ReactNode;
  container?: HTMLElement | null;
}) {
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return createPortal(children, container ?? document.body);
}
