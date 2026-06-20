import { describe, expect, it } from "vitest";
import { legalPagesEn } from "./content/en";
import { legalPagesEs } from "./content/es";
import { CURRENT_LEGAL_REVISION } from "./constants";
import type { LegalPageId } from "./types";

const PAGE_IDS: LegalPageId[] = ["about", "contact", "privacy", "terms"];

describe("legal page content", () => {
  it("EN and ES share section ids and revision", () => {
    for (const pageId of PAGE_IDS) {
      const en = legalPagesEn[pageId];
      const es = legalPagesEs[pageId];
      expect(en.legalRevision).toBe(CURRENT_LEGAL_REVISION);
      expect(es.legalRevision).toBe(CURRENT_LEGAL_REVISION);
      expect(en.sections.map((s) => s.id)).toEqual(es.sections.map((s) => s.id));
    }
  });

  it("privacy and terms expose TOC", () => {
    expect(legalPagesEn.privacy.showToc).toBe(true);
    expect(legalPagesEn.terms.showToc).toBe(true);
  });

  it("privacy includes storage key table", () => {
    const storageSection = legalPagesEn.privacy.sections.find((s) => s.id === "local-storage");
    expect(storageSection).toBeDefined();
    const table = storageSection?.blocks.find((b) => b.type === "table");
    expect(table?.type).toBe("table");
    if (table?.type === "table") {
      expect(table.rows.some((row) => row[0] === "camaleon-legal-revision-ack")).toBe(true);
    }
  });
});
