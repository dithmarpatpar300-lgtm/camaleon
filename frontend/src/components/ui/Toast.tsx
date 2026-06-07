"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/I18nProvider";

type ToastVariant = "success" | "info";

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  onDismiss?: () => void;
};

const variantStyles: Record<ToastVariant, string> = {
  success: "border-accent/30 bg-accent-subtle text-accent",
  info: "border-info/30 bg-info/10 text-info",
};

export function Toast({ message, variant = "info", onDismiss }: ToastProps) {
  const { t } = useI18n();
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg",
        "motion-safe:animate-[fadeIn_200ms_ease-out]",
        variantStyles[variant]
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex-1">{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label={t("toast.dismiss")}
            className="shrink-0 rounded-md p-1 text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
