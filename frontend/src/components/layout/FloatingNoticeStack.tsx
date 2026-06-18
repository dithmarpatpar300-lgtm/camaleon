"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StackProps = {
  children: ReactNode;
};

export function NoticeStackItem({
  children,
  className,
}: StackProps & { className?: string }) {
  return <div className={cn("floating-notice-stack__item", className)}>{children}</div>;
}

/** Bottom-center stack: first child sits nearest the viewport edge, later children stack upward. */
export function BottomNoticeStack({ children }: StackProps) {
  return (
    <div className="floating-notice-stack floating-notice-stack--bottom" aria-live="polite">
      {children}
    </div>
  );
}

/** Top-right stack: first child sits nearest the header, later children stack downward. */
export function TopRightNoticeStack({ children }: StackProps) {
  return (
    <div className="floating-notice-stack floating-notice-stack--top-right" aria-live="polite">
      {children}
    </div>
  );
}
