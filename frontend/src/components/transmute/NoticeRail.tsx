"use client";

import { useEffect, useMemo, useState } from "react";
import type { Notice, NoticeAction } from "@/lib/notices/types";
import {
  filterNoticesForDensity,
  getEffectiveNoticesPrefs,
  subscribeNoticesPrefs,
} from "@/lib/prefs/notices-prefs";
import { NoticePanel } from "./NoticePanel";

type NoticeRailProps = {
  notices: Notice[];
  onAction?: (action: NoticeAction) => void;
  className?: string;
};

export function NoticeRail({ notices, onAction, className }: NoticeRailProps) {
  const [prefsRevision, setPrefsRevision] = useState(0);

  useEffect(() => subscribeNoticesPrefs(() => setPrefsRevision((v) => v + 1)), []);

  const visibleNotices = useMemo(() => {
    void prefsRevision;
    return filterNoticesForDensity(notices, getEffectiveNoticesPrefs().railDensity);
  }, [notices, prefsRevision]);

  if (visibleNotices.length === 0) return null;

  return (
    <div className={className ?? "mb-4 space-y-2"}>
      {visibleNotices.map((notice) => (
        <NoticePanel key={notice.id} notice={notice} onAction={onAction} />
      ))}
    </div>
  );
}
