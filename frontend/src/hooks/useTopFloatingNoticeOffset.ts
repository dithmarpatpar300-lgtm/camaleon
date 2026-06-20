"use client";

import { useLayoutEffect, type RefObject } from "react";

const TOP_NOTICE_GAP_PX = 8;

/**
 * Publishes `--layout-top-notice-height` so sticky subnav (ToolBrowser) sits below
 * fixed top notices (offline status) instead of overlapping on mobile scroll.
 */
export function useTopFloatingNoticeOffset(
  hostRef: RefObject<HTMLElement | null>
): void {
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const update = () => {
      const stack = host.querySelector<HTMLElement>(".floating-notice-stack--top-right");
      if (!stack) {
        document.documentElement.style.setProperty("--layout-top-notice-height", "0px");
        return;
      }

      const hasVisibleChild = Array.from(stack.children).some((node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.offsetHeight > 0;
      });

      const height = hasVisibleChild
        ? stack.getBoundingClientRect().height + TOP_NOTICE_GAP_PX
        : 0;

      document.documentElement.style.setProperty(
        "--layout-top-notice-height",
        `${height}px`
      );
    };

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(host);

    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    update();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      document.documentElement.style.setProperty("--layout-top-notice-height", "0px");
    };
  }, [hostRef]);
}
