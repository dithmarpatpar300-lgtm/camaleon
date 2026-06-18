"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getRiskModePrefs,
  isRiskModeEnabled,
  RISK_MODE_CHANGED_EVENT,
  setRiskModeEnabled,
  type RiskModePrefs,
} from "@/lib/prefs/risk-mode";

type RiskModeContextValue = {
  riskModeEnabled: boolean;
  riskModePrefs: RiskModePrefs;
  enableRiskMode: () => void;
  disableRiskMode: () => void;
  setRiskMode: (enabled: boolean) => void;
};

const RiskModeContext = createContext<RiskModeContextValue | null>(null);

export function useRiskMode(): RiskModeContextValue {
  const ctx = useContext(RiskModeContext);
  if (!ctx) {
    throw new Error("useRiskMode must be used within RiskModeProvider");
  }
  return ctx;
}

export function RiskModeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<RiskModePrefs>(() =>
    typeof window === "undefined" ? { enabled: false } : getRiskModePrefs()
  );

  const refresh = useCallback(() => {
    setPrefs(getRiskModePrefs());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(RISK_MODE_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(RISK_MODE_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const setRiskMode = useCallback((enabled: boolean) => {
    setPrefs(setRiskModeEnabled(enabled));
  }, []);

  const enableRiskMode = useCallback(() => setRiskMode(true), [setRiskMode]);
  const disableRiskMode = useCallback(() => setRiskMode(false), [setRiskMode]);

  const value = useMemo(
    () => ({
      riskModeEnabled: prefs.enabled === true,
      riskModePrefs: prefs,
      enableRiskMode,
      disableRiskMode,
      setRiskMode,
    }),
    [prefs, enableRiskMode, disableRiskMode, setRiskMode]
  );

  return <RiskModeContext.Provider value={value}>{children}</RiskModeContext.Provider>;
}

/** Safe read for SSR / tests — no provider required. */
export function readRiskModeEnabled(): boolean {
  return isRiskModeEnabled();
}
