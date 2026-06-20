"use client";

import type { LegalSection } from "@/lib/legal/types";
import { useI18n } from "@/providers/I18nProvider";

type LegalTocProps = {
  sections: LegalSection[];
};

export function LegalToc({ sections }: LegalTocProps) {
  const { t } = useI18n();
  const countLabel =
    sections.length === 1
      ? t("legal.tocSection", { count: String(sections.length) })
      : t("legal.tocSections", { count: String(sections.length) });

  return (
    <nav className="legal-toc-shell" aria-label={t("legal.tocLabel")}>
      <div className="legal-toc-toolbar">
        <span className="legal-toc-toolbar-label">{t("legal.tocHeading")}</span>
        <span className="legal-toc-toolbar-count">{countLabel}</span>
      </div>

      <ol className="legal-toc-list">
        {sections.map((section, index) => (
          <li key={section.id} className="legal-toc-item">
            <a href={`#${section.id}`} className="legal-toc-link">
              <span className="legal-toc-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="legal-toc-title">{section.title}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="legal-toc-chevron"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
