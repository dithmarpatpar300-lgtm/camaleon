"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/I18nProvider";
import type { ToastVariant } from "@/lib/toast";

type ToastCardProps = {
  message: string;
  variant?: ToastVariant;
  exiting?: boolean;
  onDismiss?: () => void;
};

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-accent/35 bg-bg-surface/95 text-text-primary shadow-[0_8px_28px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.04)]",
  info: "border-info/35 bg-bg-surface/95 text-text-primary shadow-[0_8px_28px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.04)]",
};

const accentStyles: Record<ToastVariant, string> = {
  success: "text-accent",
  info: "text-info",
};

export function ToastCard({ message, variant = "info", exiting = false, onDismiss }: ToastCardProps) {
  const { t } = useI18n();

  return (
    <div
      role="status"
      aria-live="polite"
      data-toast-variant={variant}
      className={cn(
        "toast-card pointer-events-auto w-full rounded-xl border px-4 py-3 text-sm backdrop-blur-md",
        exiting ? "toast-card--exiting" : "toast-card--entering",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center", accentStyles[variant])}
          aria-hidden="true"
        >
          {variant === "success" ? (
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path
                fillRule="evenodd"
                d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path
                fillRule="evenodd"
                d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 4.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 6.75a.875.875 0 100 1.75.875.875 0 000-1.75z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1 line-clamp-3 leading-snug text-text-secondary">{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t("toast.dismiss")}
            className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
