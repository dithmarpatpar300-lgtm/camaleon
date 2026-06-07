"use client";

import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";

export function UtilityCluster() {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-bg-elevated/60 px-1 py-0.5">
      <LanguageSelector />
      <div className="h-4 w-px bg-border" aria-hidden />
      <ThemeToggle />
    </div>
  );
}
