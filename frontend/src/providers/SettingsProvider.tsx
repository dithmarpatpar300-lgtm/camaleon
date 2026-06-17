"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";

type SettingsContextValue = {
  openSettings: () => void;
  closeSettings: () => void;
  settingsOpen: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const value = useMemo(
    () => ({ openSettings, closeSettings, settingsOpen }),
    [openSettings, closeSettings, settingsOpen]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
      <SettingsDrawer open={settingsOpen} onClose={closeSettings} />
    </SettingsContext.Provider>
  );
}
