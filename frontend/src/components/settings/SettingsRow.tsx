"use client";

import { cn } from "@/lib/utils";

type SettingsRowProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** When false, omit bottom border (last row in a section). */
  bordered?: boolean;
  /** Stacked: label + control full-width columns (better for wide segments). */
  layout?: "inline" | "stacked";
  /** Enables settings deep-link row pulse (see settings-focus.ts). */
  id?: string;
};

export function SettingsRow({
  label,
  description,
  children,
  className,
  bordered = true,
  layout = "inline",
  id,
}: SettingsRowProps) {
  const stacked = layout === "stacked";

  return (
    <div
      id={id}
      data-settings-focus-row={id ? "" : undefined}
      className={cn(
        stacked
          ? "flex flex-col gap-2.5 px-4 py-4"
          : "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        bordered && "border-b border-border last:border-b-0",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p>
        )}
      </div>
      <div className={cn(stacked ? "w-full min-w-0" : "shrink-0 sm:pl-2")}>{children}</div>
    </div>
  );
}
