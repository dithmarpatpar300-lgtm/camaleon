"use client";

import { cn } from "@/lib/utils";

type ActionInlinePillProps = {
  label: string;
  toolSlug: string;
  onClick: () => void;
  className?: string;
};

export function ActionInlinePill({ label, onClick, className }: ActionInlinePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-accent-subtle",
        "px-1.5 py-0.5 text-xs font-medium text-accent",
        "transition-colors hover:bg-accent/20 align-middle mx-0.5",
        className,
      )}
    >
      {label}
      <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4.5 2.5L8 6L4.5 9.5" />
      </svg>
    </button>
  );
}
