export type LegalPageId = "about" | "contact" | "privacy" | "terms";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  listItems?: string[];
};

export type LegalAction = {
  label: string;
  href: string;
  external?: boolean;
};

export type LegalPageContent = {
  title: string;
  description: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
  actions?: LegalAction[];
};
