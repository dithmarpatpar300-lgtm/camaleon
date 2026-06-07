"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/providers/I18nProvider";

type KeyboardShortcutsDialogProps = {
  open: boolean;
  onClose: () => void;
};

function modKey(): string {
  if (typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="command-palette fixed inset-0 m-0 h-full w-full max-w-none bg-transparent p-4 sm:p-8 md:p-16"
      aria-label={t("footer.shortcutsTitle")}
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onClose={onClose}
    >
      <div
        className="glass-palette mx-auto mt-16 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/8 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            {t("footer.shortcutsTitle")}
          </p>
        </div>
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t("footer.shortcutOpenPalette")}</span>
            <kbd className="rounded border border-border px-2 py-0.5 font-mono text-xs text-text-muted">
              {modKey()}+K
            </kbd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t("footer.shortcutClose")}</span>
            <kbd className="rounded border border-border px-2 py-0.5 font-mono text-xs text-text-muted">
              Esc
            </kbd>
          </div>
        </div>
        <div className="border-t border-white/5 px-4 py-2 text-right">
          <span className="text-xs text-text-muted">{t("commandPalette.closeHint")}</span>
        </div>
      </div>
    </dialog>
  );
}
