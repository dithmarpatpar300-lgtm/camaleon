import { cookies } from "next/headers";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import {
  getLegalMetadata,
  LOCALE_COOKIE_NAME,
  resolveLocaleFromCookie,
} from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveLocaleFromCookie(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  return getLegalMetadata(locale, "privacy");
}

export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <LegalDocument pageId="privacy" />
    </LegalPageShell>
  );
}
