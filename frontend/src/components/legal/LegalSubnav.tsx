"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_PAGES } from "@/lib/legal/pages";
import { useI18n } from "@/providers/I18nProvider";

export function LegalSubnav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="legal-subnav" aria-label={t("legal.subnavLabel")}>
      <ul className="legal-subnav-list">
        {LEGAL_PAGES.map((page) => {
          const active = pathname === page.href;
          return (
            <li key={page.id}>
              <Link
                href={page.href}
                className={active ? "legal-subnav-link legal-subnav-link-active" : "legal-subnav-link"}
                aria-current={active ? "page" : undefined}
              >
                {t(page.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
