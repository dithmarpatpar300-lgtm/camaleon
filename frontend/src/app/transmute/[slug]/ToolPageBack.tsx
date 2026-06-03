"use client";

import Link from "next/link";
import { useI18n } from "@/providers/I18nProvider";

export function ToolPageBack() {
  const { t } = useI18n();

  return (
    <Link
      href="/"
      className="mb-8 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-secondary"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L5.47 8.53a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z"
          clipRule="evenodd"
        />
      </svg>
      {t("nav.transmutations")}
    </Link>
  );
}
