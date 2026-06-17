"use client";

import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <h3 className="px-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl border border-border bg-bg-surface shadow-sm">
        {children}
      </div>
    </section>
  );
}
