"use client";

import { useI18n } from "@/providers/I18nProvider";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="pb-8 pt-20 text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
        {t("landing.hero.title")}
      </h1>
      <p className="text-pretty text-lg leading-snug text-text-secondary">
        {t("landing.hero.tagline")}
      </p>
    </section>
  );
}
