import type { ReleaseHighlightIcon as IconName } from "@/lib/releases/types";
import { cn } from "@/lib/utils";

type Props = {
  name: IconName;
  className?: string;
};

export function ReleaseHighlightIcon({ name, className }: Props) {
  const base = cn("h-4 w-4 shrink-0 text-accent", className);

  switch (name) {
    case "shield":
      return (
        <svg className={base} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 1.2L2.5 3.4v4.1c0 3.1 2.3 5.9 5.5 6.9 3.2-1 5.5-3.8 5.5-6.9V3.4L8 1.2zm0 1.4l3.5 1.6v3.3c0 2.3-1.6 4.4-3.5 5.2-1.9-.8-3.5-2.9-3.5-5.2V4.2L8 2.6z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg className={base} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 1.5l1.1 3.4h3.6L10.2 7.6l1.1 3.4L8 8.8 4.7 11l1.1-3.4L3.3 4.9h3.6L8 1.5z" />
        </svg>
      );
    case "tool":
      return (
        <svg className={base} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M11.5 2a3.5 3.5 0 00-2.45 6.01L4.7 12.35a1 1 0 001.41 1.41l4.35-4.35A3.5 3.5 0 1011.5 2zm0 1.5a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
      );
    case "cpu":
      return (
        <svg className={base} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M5 2.5h6v1H5v-1zm-1 2h8v7H4v-7zm1 1v5h6V5.5H5zm-2 0h1v5H3v-5zm10 0h1v5h-1v-5zM6 1.5h1V3H6V1.5zm3 0h1V3H9V1.5zm3 0h1V3h-1V1.5zM6 13h1v1.5H6V13zm3 0h1v1.5H9V13zm3 0h1v1.5h-1V13z" />
        </svg>
      );
    case "image":
      return (
        <svg className={base} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M3 3.5A1.5 1.5 0 014.5 2h7A1.5 1.5 0 0113 3.5v9a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 12.5v-9zM4.5 3a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h7a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5h-7zm1.75 2.25a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zm-1.03 6.28l2.5-2.5a.5.5 0 01.7 0l1.8 1.8 2.3-2.3a.5.5 0 01.8.4v3.27a.5.5 0 01-.5.5h-7a.5.5 0 01-.38-.17z" />
        </svg>
      );
    case "memory":
      return (
        <svg className={base} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M2.5 5.5A1.5 1.5 0 014 4h8a1.5 1.5 0 011.5 1.5v5A1.5 1.5 0 0112 12H4a1.5 1.5 0 01-1.5-1.5v-5zM4 5a.5.5 0 00-.5.5v5a.5.5 0 00.5.5h8a.5.5 0 00.5-.5v-5A.5.5 0 0012 5H4zm1 1.5h1V7H5v-.5zm2.5 0h1V7h-1v-.5zm2.5 0h1V7H10v-.5zM5 8.5h1V9H5v-.5zm2.5 0h1V9h-1v-.5zm2.5 0h1V9H10v-.5z" />
        </svg>
      );
    default:
      return null;
  }
}
