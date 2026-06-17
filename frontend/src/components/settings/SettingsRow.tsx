"use client";

import { cn } from "@/lib/utils";

type SettingsRowProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** When false, omit bottom border (last row in a section). */
  bordered?: boolean;
};

export function SettingsRow({
  label,
  description,
  children,
  className,
  bordered = true,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        bordered && "border-b border-border last:border-b-0",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{description}</p>
        )}
      </div>
      <div className="shrink-0 sm:pl-2">{children}</div>
    </div>
  );
}
