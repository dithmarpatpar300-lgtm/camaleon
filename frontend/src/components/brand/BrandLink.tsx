"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CamaleonMark } from "./CamaleonMark";

type BrandLinkProps = {
  className?: string;
};

export function BrandLink({ className }: BrandLinkProps) {
  return (
    <Link
      href="/"
      aria-label="Camaleon"
      className={cn(
        "group flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl py-1 pl-1 pr-2",
        "transition-all duration-200",
        "hover:bg-accent-subtle/15 hover:ring-1 hover:ring-accent/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
        "active:scale-[0.98] motion-reduce:active:scale-100",
        className
      )}
    >
      <CamaleonMark frameClassName="h-10 w-10" />
      <span
        className={cn(
          "truncate text-sm font-semibold leading-none tracking-tight text-text-primary sm:text-base",
          "transition-colors group-hover:text-text-primary"
        )}
      >
        Camaleon
      </span>
    </Link>
  );
}
