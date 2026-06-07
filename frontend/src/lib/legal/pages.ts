import type { LegalPageId } from "./types";

export const LEGAL_PAGES: ReadonlyArray<{
  id: LegalPageId;
  href: `/${string}`;
  labelKey: `footer.${string}`;
}> = [
  { id: "about", href: "/about", labelKey: "footer.about" },
  { id: "contact", href: "/contact", labelKey: "footer.contact" },
  { id: "privacy", href: "/privacy", labelKey: "footer.privacyPolicy" },
  { id: "terms", href: "/terms", labelKey: "footer.terms" },
] as const;
