"use client";
import { Suspense } from "react";
import LoadingState from "./LoadingState";

export default function RootPage() {
  return (
    <Suspense fallback={<LoadingState type="loading" />}>
      <LoadingState type="loading" />
    </Suspense>
  );
}
