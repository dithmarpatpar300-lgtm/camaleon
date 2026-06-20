"use client";

import type { LegalSection } from "@/lib/legal/types";
import { useI18n } from "@/providers/I18nProvider";

type LegalTocProps = {
  sections: LegalSection[];
};

export function LegalToc({ sections }: LegalTocProps) {
  const { t } = useI18n();

  return (
    <nav className="legal-toc" aria-label={t("legal.tocLabel")}>
      <p className="legal-toc-heading">{t("legal.tocHeading")}</p>
      <ol className="legal-toc-list">
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="legal-toc-link">
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
