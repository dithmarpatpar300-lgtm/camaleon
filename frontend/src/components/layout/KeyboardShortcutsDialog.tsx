"use client";

import { SurfaceDialog } from "@/components/ui/SurfaceDialog";
import { SurfaceBackdrop, SurfacePanel } from "@/components/ui/SurfaceSheet";
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

  return (
    <SurfaceDialog open={open} onClose={onClose} ariaLabel={t("footer.shortcutsTitle")}>
      <SurfaceBackdrop layout="centered" onDismiss={onClose}>
        <SurfacePanel className="mx-auto mt-16 w-full max-w-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3">
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
          <div className="border-t border-border px-4 py-2 text-right">
            <span className="text-xs text-text-muted">{t("commandPalette.closeHint")}</span>
          </div>
        </SurfacePanel>
      </SurfaceBackdrop>
    </SurfaceDialog>
  );
}
