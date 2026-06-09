"use client";

import { useLayoutEffect } from "react";
import { acquireScrollLock } from "@/lib/scroll-lock";

/** Locks document scroll while `active` is true (reference-counted). */
export function useScrollLock(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return;
    return acquireScrollLock();
  }, [active]);
}
