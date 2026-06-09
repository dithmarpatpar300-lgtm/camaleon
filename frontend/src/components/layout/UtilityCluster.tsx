"use client";

import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";

export function UtilityCluster() {
  return (
    <div className="flex h-8 shrink-0 items-center gap-0.5 rounded-full border border-border bg-bg-elevated/40 px-1.5 py-0.5">
      <LanguageSelector />
      <div className="h-3.5 w-px bg-border/80" aria-hidden />
      <ThemeToggle />
    </div>
  );
}
