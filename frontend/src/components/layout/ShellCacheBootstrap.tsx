"use client";

import { useEffect, useRef } from "react";
import { readBrowserOnline } from "@/lib/offline/connectivity";
import { reprecacheAppShell } from "@/lib/offline/reprecache-app-shell";
import { isShellReady } from "@/lib/offline/shell-cache-status";
import { consumeShellReprecachePending } from "@/lib/offline/shell-reprecache-session";
import { getServiceWorkerRegistration } from "@/lib/offline/sw-registration";

/**
 * Silently repopulates app shell when online and cache is incomplete.
 * Runs after app update reload (session flag) or on first visit post-clear.
 */
export function ShellCacheBootstrap() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (!readBrowserOnline()) return;

    ranRef.current = true;

    void (async () => {
      const registration = await getServiceWorkerRegistration();
      if (!registration) return;

      const pending = consumeShellReprecachePending();
      const ready = pending ? false : await isShellReady();

      if (!pending && ready) return;

      await reprecacheAppShell();
    })();
  }, []);

  return null;
}
