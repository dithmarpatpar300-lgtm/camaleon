import { readUserSettings, writeUserSettings, type RiskModePrefs } from "./user-settings";

export type { RiskModePrefs };

export const RISK_MODE_CHANGED_EVENT = "camaleon-risk-mode-changed";

export function getRiskModePrefs(): RiskModePrefs {
  return readUserSettings().riskMode ?? { enabled: false };
}

export function isRiskModeEnabled(): boolean {
  return getRiskModePrefs().enabled === true;
}

export function setRiskModeEnabled(enabled: boolean): RiskModePrefs {
  const next: RiskModePrefs = {
    enabled,
    acknowledgedAt: enabled ? new Date().toISOString() : undefined,
  };
  writeUserSettings({ riskMode: next });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RISK_MODE_CHANGED_EVENT, { detail: next }));
  }
  return next;
}
