import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "lossless" | "lossy" | "neutral";

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  lossless: "bg-accent-subtle text-accent",
  lossy: "bg-bg-elevated text-lossy",
  neutral: "bg-bg-elevated text-text-secondary",
};

export function Badge({
  variant = "neutral",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
