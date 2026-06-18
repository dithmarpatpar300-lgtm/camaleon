"use client";

import { useI18n } from "@/providers/I18nProvider";
import Link from "next/link";

export default function OfflineFallbackPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-text-primary">
        {t("offline.fallbackTitle")}
      </h1>
      <p className="text-sm text-text-secondary">{t("offline.fallbackBody")}</p>
      <Link
        href="/"
        className="rounded-lg border border-border bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary hover:border-accent/30"
      >
        {t("offline.fallbackHome")}
      </Link>
    </div>
  );
}
