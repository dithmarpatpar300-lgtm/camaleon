"use client";

import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";

export function UtilityCluster() {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-border bg-bg-elevated/60 p-0.5">
      <LanguageSelector />
      <div className="h-4 w-px bg-border" aria-hidden />
      <ThemeToggle />
    </div>
  );
}
