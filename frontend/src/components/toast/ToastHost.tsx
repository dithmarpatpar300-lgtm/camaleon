"use client";

import { ToastCard } from "@/components/toast/ToastCard";
import { ToastViewport } from "@/components/toast/ToastViewport";
import { NoticeStackItem } from "@/components/layout/FloatingNoticeStack";
import { useToastStack } from "@/providers/ToastProvider";

/** Renders the bottom-center toast queue inside the floating notice stack. */
export function ToastHost() {
  const { items, dismissToast } = useToastStack();

  if (items.length === 0) return null;

  return (
    <NoticeStackItem className="floating-notice-stack__item--toasts">
      <ToastViewport itemCount={items.length}>
        {[...items].reverse().map((item) => (
          <ToastCard
            key={item.id}
            message={item.message}
            variant={item.variant}
            exiting={item.exiting}
            onDismiss={item.exiting ? undefined : () => dismissToast(item.id)}
          />
        ))}
      </ToastViewport>
    </NoticeStackItem>
  );
}
