"use client";

import { useId, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type Props = {
  labelKey: string;
  bodyKey: string;
  className?: string;
};

export function TechnicalDisclosure({ labelKey, bodyKey, className }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={cn("rounded-xl border border-white/6 bg-bg-elevated/40", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset rounded-xl"
      >
        <span>{t(labelKey)}</span>
        <svg
          className={cn("h-3.5 w-3.5 shrink-0 text-text-muted transition-transform", open && "rotate-180")}
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.47 6.47a.75.75 0 011.06 0L8 8.94l2.47-2.47a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 010-1.06z" />
        </svg>
      </button>
      {open && (
        <div id={panelId} className="border-t border-white/5 px-3 py-2.5">
          <p className="text-xs leading-relaxed text-text-muted">{t(bodyKey)}</p>
        </div>
      )}
    </div>
  );
}
