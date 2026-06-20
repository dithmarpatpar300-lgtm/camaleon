"use client";

import { AppUpdateNotice } from "@/components/app-update/AppUpdateNotice";
import { OfflineInstallPromoNotice } from "@/components/offline/OfflineInstallPromoNotice";
import { OfflineStatusNotice } from "@/components/layout/OfflineStatusNotice";
import {
  BottomLeftNoticeStack,
  BottomNoticeStack,
  NoticeStackItem,
  TopRightNoticeStack,
} from "@/components/layout/FloatingNoticeStack";
import { ToastHost } from "@/components/toast/ToastHost";

type Props = {
  variant: "top" | "bottom" | "bottom-left";
  /** Mobile: single bottom stack (promo + offline dock + toasts) — avoids host overlap. */
  offlineDock?: boolean;
};

export function FloatingNotices({ variant, offlineDock = false }: Props) {
  if (variant === "top") {
    return (
      <TopRightNoticeStack>
        <NoticeStackItem>
          <OfflineStatusNotice />
        </NoticeStackItem>
      </TopRightNoticeStack>
    );
  }

  if (variant === "bottom-left") {
    return (
      <BottomLeftNoticeStack>
        <NoticeStackItem>
          <OfflineInstallPromoNotice />
        </NoticeStackItem>
      </BottomLeftNoticeStack>
    );
  }

  if (offlineDock) {
    return (
      <BottomNoticeStack>
        <ToastHost />
        <NoticeStackItem>
          <OfflineStatusNotice layout="dock" />
        </NoticeStackItem>
        <NoticeStackItem>
          <OfflineInstallPromoNotice />
        </NoticeStackItem>
        <NoticeStackItem>
          <AppUpdateNotice />
        </NoticeStackItem>
      </BottomNoticeStack>
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
