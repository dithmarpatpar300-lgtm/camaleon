"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { resetScrollLock } from "@/lib/scroll-lock";

/** Clears any orphaned scroll lock when navigating between routes. */
export function ScrollLockRouteGuard() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    resetScrollLock();
  }, [pathname]);

  return null;
}
