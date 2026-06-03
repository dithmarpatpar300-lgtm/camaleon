"use client";

import { useI18n } from "@/providers/I18nProvider";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-text-muted">
        <p>{t("footer.privacy")}</p>
        <p>{t("footer.version", { version: "0.6.4" })}</p>
      </div>
    </footer>
  );
}
