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
import {
  createSettingsFocusRequest,
  type SettingsFocusRequest,
  type SettingsFocusTarget,
} from "@/lib/settings/settings-focus";

export type OpenSettingsOptions = {
  /** Scroll to this section after the drawer opens and pulse its card. */
  focus?: SettingsFocusTarget;
};

type SettingsContextValue = {
  openSettings: (options?: OpenSettingsOptions) => void;
  closeSettings: () => void;
  settingsOpen: boolean;
  focusRequest: SettingsFocusRequest | null;
  clearFocusRequest: () => void;
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
  const [focusRequest, setFocusRequest] = useState<SettingsFocusRequest | null>(null);

  const openSettings = useCallback((options?: OpenSettingsOptions) => {
    if (options?.focus) {
      setFocusRequest(createSettingsFocusRequest(options.focus));
    }
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setFocusRequest(null);
  }, []);

  const clearFocusRequest = useCallback(() => {
    setFocusRequest(null);
  }, []);

  const value = useMemo(
    () => ({
      openSettings,
      closeSettings,
      settingsOpen,
      focusRequest,
      clearFocusRequest,
    }),
    [openSettings, closeSettings, settingsOpen, focusRequest, clearFocusRequest]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
      <SettingsDrawer open={settingsOpen} onClose={closeSettings} />
    </SettingsContext.Provider>
  );
}
