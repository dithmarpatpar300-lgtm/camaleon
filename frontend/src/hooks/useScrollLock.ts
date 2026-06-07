"use client";

import { useEffect } from "react";
import { acquireScrollLock } from "@/lib/scroll-lock";

/** Locks document scroll while `active` is true (reference-counted). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    return acquireScrollLock();
  }, [active]);
}
