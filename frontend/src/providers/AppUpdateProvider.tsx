"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useUpdateEngine, type UpdateEngineValue } from "@/lib/app-update/update-engine";
import { HARD_RELOAD_QUERY_PARAM } from "@/lib/app-update";

export type { CheckForUpdatesResult } from "@/lib/app-update/update-engine";

const AppUpdateContext = createContext<UpdateEngineValue | null>(null);

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const engine = useUpdateEngine();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has(HARD_RELOAD_QUERY_PARAM)) {
      url.searchParams.delete(HARD_RELOAD_QUERY_PARAM);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const value = useMemo(() => engine, [engine]);

  return (
    <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>
  );
}

export function useAppUpdate(): UpdateEngineValue {
  const ctx = useContext(AppUpdateContext);
  if (!ctx) {
    throw new Error("useAppUpdate must be used within AppUpdateProvider");
  }
  return ctx;
}
