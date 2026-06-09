"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceBackdropProps = {
  onDismiss: () => void;
  layout?: "centered" | "palette" | "onboarding";
  className?: string;
  children: ReactNode;
};

const LAYOUT_CLASSES = {
  centered: "flex h-full w-full items-center justify-center p-4 sm:p-8 md:p-16",
  palette:
    "flex h-full w-full items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-start sm:pt-16",
  onboarding:
    "flex h-full w-full items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:justify-end sm:p-6",
} as const;

/** Full-viewport click target; dismisses when the scrim (not the panel) is clicked. */
export function SurfaceBackdrop({
  onDismiss,
  layout = "centered",
  className,
  children,
}: SurfaceBackdropProps) {
  return (
    <div
      className={cn(LAYOUT_CLASSES[layout], className)}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      {children}
    </div>
  );
}

type SurfacePanelProps = {
  children: ReactNode;
  className?: string;
  variant?: "raised" | "floating" | "sheet";
  role?: string;
};

/** Opaque panel inside a SurfaceDialog — stops backdrop clicks from bubbling. */
export function SurfacePanel({
  children,
  className,
  variant = "raised",
  role,
}: SurfacePanelProps) {
  return (
    <div
      role={role}
      className={cn(
        variant === "raised" && "surface-raised",
        variant === "floating" && "surface-floating",
        variant === "sheet" && "surface-raised max-sm:surface-sheet-mobile",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
