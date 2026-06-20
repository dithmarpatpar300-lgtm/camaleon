"use client";

import Link from "next/link";
import { useI18n } from "@/providers/I18nProvider";
import { getLegalPageContent, type LegalPageId } from "@/lib/legal";
import { LegalBlockRenderer } from "./LegalBlockRenderer";
import { LegalSubnav } from "./LegalSubnav";
import { LegalToc } from "./LegalToc";

type LegalDocumentProps = {
  pageId: LegalPageId;
};

export function LegalDocument({ pageId }: LegalDocumentProps) {
  const { locale, t } = useI18n();
  const page = getLegalPageContent(locale, pageId);

  return (
    <article className="legal-document">
      <Link href="/" className="legal-back-link group mb-6 inline-flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L5.47 8.53a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z"
            clipRule="evenodd"
          />
        </svg>
        {t("legal.backHome")}
      </Link>

      <LegalSubnav />

      <header className="legal-document-header">
        <h1 className="legal-document-title">{page.title}</h1>
        <div className="legal-document-meta">
          <span className="legal-meta-item">
            {t("legal.lastUpdated", { date: page.lastUpdated })}
          </span>
          <span className="legal-meta-separator" aria-hidden="true">
            ·
          </span>
          <span className="legal-meta-item">
            {t("legal.revision", { revision: page.legalRevision })}
          </span>
        </div>
        {page.intro && <p className="legal-document-intro">{page.intro}</p>}
      </header>

      {page.showToc && (
        <LegalToc sections={page.sections} />
      )}

      {page.actions && page.actions.length > 0 && (
        <div className="legal-actions">
          {page.actions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noopener noreferrer" : undefined}
              className={
                action.primary ? "legal-action-chip legal-action-chip-primary" : "legal-action-chip"
              }
            >
              {action.label}
              {action.external && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3.5 w-3.5 opacity-50"
                  aria-hidden="true"
                >
                  <path d="M6.22 8.72a.75.75 0 001.06 1.06l3.25-3.25a.75.75 0 000-1.06L7.28 2.22a.75.75 0 00-1.06 1.06L8.94 7 6.22 8.72z" />
                  <path d="M3.5 3.75a.75.75 0 00-1.5 0v8.5c0 .414.336.75.75.75h8.5a.75.75 0 000-1.5H4.25v-7.75z" />
                </svg>
              )}
            </a>
          ))}
        </div>
      )}

      <div className="legal-sections">
        {page.sections.map((section) => (
          <section key={section.id} id={section.id} className="legal-section">
            <h2 className="legal-section-title">{section.title}</h2>
            <div className="legal-section-body">
              {section.blocks.map((block, blockIndex) => (
                <LegalBlockRenderer key={`${section.id}-${blockIndex}`} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
