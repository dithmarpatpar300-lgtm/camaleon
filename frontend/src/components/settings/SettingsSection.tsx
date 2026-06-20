"use client";

import type { SettingsFocusTarget } from "@/lib/settings/settings-focus";
import { SETTINGS_FOCUS } from "@/lib/settings/settings-focus";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Enables settings deep-link scroll + identity-matched focus pulse. */
  focusTarget?: SettingsFocusTarget;
};

export function SettingsSection({ title, children, className, focusTarget }: SettingsSectionProps) {
  const sectionId = focusTarget ? SETTINGS_FOCUS[focusTarget].sectionId : undefined;

  return (
    <section id={sectionId} className={cn("scroll-mt-4 flex flex-col gap-2", className)}>
      <h3 className="px-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        {title}
      </h3>
      <div
        data-settings-focus-card
        className="overflow-hidden rounded-xl border border-border bg-bg-surface shadow-sm"
      >
        {children}
      </div>
    </section>
  );
}
