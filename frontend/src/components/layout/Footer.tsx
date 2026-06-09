"use client";

import Link from "next/link";
import { Fragment, useState, type ReactNode } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { LEGAL_PAGES } from "@/lib/legal";
import {
  APP_VERSION,
  COPYRIGHT_YEAR,
  SITE_LICENSE,
  SITE_NAME,
  SITE_REPO_URL,
} from "@/lib/site";
import { cn } from "@/lib/utils";
import { useReleaseComms } from "@/providers/ReleaseCommsProvider";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

function FooterDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("select-none px-1 text-text-muted/40", className)}
      aria-hidden="true"
    >
      ·
    </span>
  );
}

type FooterItemProps = {
  children: ReactNode;
  className?: string;
};

function FooterItem({ children, className }: FooterItemProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>{children}</span>
  );
}

const footerLinkClass =
  "text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:text-accent";

export function Footer() {
  const { t } = useI18n();
  const { openWhatsNew } = useReleaseComms();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const utilityItems = [
    {
      key: "github",
      node: (
        <a
          href={SITE_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={footerLinkClass}
        >
          {t("footer.github")}
        </a>
      ),
    },
    {
      key: "whatsNew",
      node: (
        <button
          type="button"
          onClick={openWhatsNew}
          className={cn(footerLinkClass, "cursor-pointer")}
        >
          {t("footer.whatsNew")}
        </button>
      ),
    },
    {
      key: "shortcuts",
      node: (
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className={cn(footerLinkClass, "cursor-pointer")}
        >
          {t("footer.shortcuts")}
        </button>
      ),
    },
  ];

  return (
    <footer className="site-footer shrink-0">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav
          aria-label={t("footer.legalNav")}
          className="flex flex-col items-center gap-3 text-xs sm:flex-row sm:justify-center"
        >
          <FooterItem className="flex flex-wrap justify-center">
            {LEGAL_PAGES.map((page, index) => (
              <Fragment key={page.id}>
                {index > 0 && <FooterDot />}
                <Link href={page.href} className={footerLinkClass}>
                  {t(page.labelKey)}
                </Link>
              </Fragment>
            ))}
          </FooterItem>

          <FooterDot className="hidden sm:inline" />

          <FooterItem className="flex flex-wrap justify-center">
            {utilityItems.map((item, index) => (
              <Fragment key={item.key}>
                {index > 0 && <FooterDot />}
                {item.node}
              </Fragment>
            ))}
          </FooterItem>
        </nav>

        <p className="mt-5 text-center font-mono text-[11px] tabular-nums tracking-wide text-text-muted/70">
          {t("footer.copyright", {
            year: COPYRIGHT_YEAR,
            name: SITE_NAME,
            license: SITE_LICENSE,
          })}
          <span className="mx-1.5 text-text-muted/30" aria-hidden="true">
            ·
          </span>
          {t("footer.version", { version: APP_VERSION })}
        </p>
      </div>

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </footer>
  );
}
