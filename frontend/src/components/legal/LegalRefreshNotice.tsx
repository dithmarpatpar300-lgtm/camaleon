"use client";

import Link from "next/link";
import { useI18n } from "@/providers/I18nProvider";
import { CURRENT_LEGAL_REVISION } from "@/lib/legal/constants";
import { SurfaceDialog } from "@/components/ui/SurfaceDialog";
import { SurfaceBackdrop, SurfacePanel } from "@/components/ui/SurfaceSheet";

type Props = {
  open: boolean;
  onAcknowledge: () => void;
};

export function LegalRefreshNotice({ open, onAcknowledge }: Props) {
  const { t } = useI18n();

  return (
    <SurfaceDialog open={open} onClose={onAcknowledge} ariaLabel={t("legalRefresh.title")}>
      <SurfaceBackdrop layout="centered" onDismiss={onAcknowledge}>
        <SurfacePanel className="mx-auto mt-8 w-full max-w-lg overflow-hidden motion-safe:animate-[prepareGateIn_340ms_cubic-bezier(0.22,1,0.36,1)_both] sm:mt-12">
          <div className="border-b border-border px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {t("legalRefresh.eyebrow")}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-text-primary">{t("legalRefresh.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t("legalRefresh.body")}</p>
            <p className="mt-3 text-sm font-medium text-text-primary">{t("legalRefresh.strong")}</p>
          </div>

          <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:flex-wrap">
            <Link
              href="/privacy"
              onClick={onAcknowledge}
              className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t("legalRefresh.readPrivacy")}
            </Link>
            <Link
              href="/terms"
              onClick={onAcknowledge}
              className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t("legalRefresh.readTerms")}
            </Link>
          </div>

          <div className="border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={onAcknowledge}
              className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
            >
              {t("legalRefresh.acknowledge")}
            </button>
            <p className="mt-3 text-xs text-text-muted">
              {t("legalRefresh.revisionNote", { revision: CURRENT_LEGAL_REVISION })}
            </p>
          </div>
        </SurfacePanel>
      </SurfaceBackdrop>
    </SurfaceDialog>
  );
}
