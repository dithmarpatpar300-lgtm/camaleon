export type LegalPageId = "about" | "contact" | "privacy" | "terms";

export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; variant: "info" | "warning"; title?: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalAction = {
  label: string;
  href: string;
  external?: boolean;
  primary?: boolean;
};

export type LegalPageContent = {
  title: string;
  description: string;
  lastUpdated: string;
  legalRevision: string;
  intro?: string;
  sections: LegalSection[];
  actions?: LegalAction[];
  /** Show table-of-contents jump links (Privacy, Terms). */
  showToc?: boolean;
};
