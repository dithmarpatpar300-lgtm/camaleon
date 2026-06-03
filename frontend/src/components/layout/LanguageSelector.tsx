"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Locale = "EN" | "ES";

export function LanguageSelector() {
  const [locale, setLocale] = useState<Locale>("ES");

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {(["EN", "ES"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cn(
            "rounded-md px-2 py-1 transition-colors",
            locale === l
              ? "bg-bg-elevated text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          )}
          aria-label={`Switch language to ${l === "EN" ? "English" : "Spanish"}`}
          aria-current={locale === l ? "true" : undefined}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
