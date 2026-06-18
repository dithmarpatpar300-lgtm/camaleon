"use client";

import { AppUpdateNotice } from "@/components/app-update/AppUpdateNotice";
import { OfflineStatusNotice } from "@/components/layout/OfflineStatusNotice";
import {
  BottomNoticeStack,
  NoticeStackItem,
  TopRightNoticeStack,
} from "@/components/layout/FloatingNoticeStack";
import { ToastHost } from "@/components/toast/ToastHost";

type Props = {
  variant: "top" | "bottom";
};

export function FloatingNotices({ variant }: Props) {
  if (variant === "top") {
    return (
      <TopRightNoticeStack>
        <NoticeStackItem>
          <OfflineStatusNotice />
        </NoticeStackItem>
      </TopRightNoticeStack>
    );
  }

  return (
    <BottomNoticeStack>
      <NoticeStackItem>
        <AppUpdateNotice />
      </NoticeStackItem>
      <ToastHost />
    </BottomNoticeStack>
  );
}
