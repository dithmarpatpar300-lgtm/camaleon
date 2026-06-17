"use client";

import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsTrigger } from "./SettingsTrigger";

export function UtilityCluster() {
  return (
    <div className="utility-cluster-shell">
      <SettingsTrigger />
      <div className="utility-cluster-divider" aria-hidden />
      <LanguageSelector />
      <div className="utility-cluster-divider" aria-hidden />
      <ThemeToggle />
    </div>
  );
}
