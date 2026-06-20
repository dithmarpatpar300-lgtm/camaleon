import type { Locale } from "@/lib/i18n/types";
import type { LegalPageContent, LegalPageId } from "./types";
import { legalPagesEn } from "./content/en";
import { legalPagesEs } from "./content/es";

const byLocale: Record<Locale, Record<LegalPageId, LegalPageContent>> = {
  en: legalPagesEn,
  es: legalPagesEs,
};

export function getLegalPageContent(
  locale: Locale,
  pageId: LegalPageId
): LegalPageContent {
  return byLocale[locale]?.[pageId] ?? byLocale.en[pageId];
}

export type { LegalPageContent, LegalPageId, LegalSection, LegalAction, LegalBlock } from "./types";
export { LEGAL_PAGES } from "./pages";
export { CURRENT_LEGAL_REVISION } from "./constants";
export {
  isLegalRevisionAcked,
  markLegalRevisionAcked,
  readLegalRevisionAck,
} from "./revision-ack";
