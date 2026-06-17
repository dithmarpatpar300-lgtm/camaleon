"use client";

import type { Notice } from "@/lib/notices/types";
import { NoticePanel } from "./NoticePanel";

type NoticeRailProps = {
  notices: Notice[];
  className?: string;
};

export function NoticeRail({ notices, className }: NoticeRailProps) {
  if (notices.length === 0) return null;

  return (
    <div className={className ?? "mb-4 space-y-2"}>
      {notices.map((notice) => (
        <NoticePanel key={notice.id} notice={notice} />
      ))}
    </div>
  );
}
