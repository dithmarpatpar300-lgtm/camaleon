"use client";

import Link from "next/link";
import { useI18n } from "@/providers/I18nProvider";
import { getLegalPageContent, type LegalPageId } from "@/lib/legal";

type LegalDocumentProps = {
  pageId: LegalPageId;
};

export function LegalDocument({ pageId }: LegalDocumentProps) {
  const { locale, t } = useI18n();
  const page = getLegalPageContent(locale, pageId);

  return (
    <article className="legal-document">
      <Link href="/" className="legal-back-link group mb-8 inline-flex items-center gap-1.5">
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

      <header className="legal-document-header">
        <span className="legal-document-accent" aria-hidden="true" />
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-[2rem]">
          {page.title}
        </h1>
        <p className="legal-updated-pill mt-4 inline-flex items-center rounded-full border border-border/80 bg-bg-elevated/60 px-3 py-1 text-xs text-text-muted">
          {t("legal.lastUpdated", { date: page.lastUpdated })}
        </p>
        {page.intro && (
          <p className="mt-5 text-base leading-relaxed text-text-secondary">
            {page.intro}
          </p>
        )}
      </header>

      {page.actions && page.actions.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-3">
          {page.actions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noopener noreferrer" : undefined}
              className="legal-action-link"
            >
              {action.label}
              {action.external && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3.5 w-3.5 opacity-60"
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

      <div className="legal-sections space-y-3">
        {page.sections.map((section, index) => (
          <section
            key={section.title}
            className="legal-section"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="text-sm leading-[1.7] text-text-secondary"
                >
                  {paragraph}
                </p>
              ))}
              {section.listItems && section.listItems.length > 0 && (
                <ul className="legal-list space-y-2.5 text-sm leading-[1.7] text-text-secondary">
                  {section.listItems.map((item) => (
                    <li key={item.slice(0, 48)}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
