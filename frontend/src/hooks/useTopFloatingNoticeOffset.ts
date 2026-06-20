"use client";

import { useLayoutEffect, type RefObject } from "react";

/** Visual breathing room between fixed top notices and the sticky tool-browser toolbar. */
const TOP_NOTICE_GAP_PX = 20;

function headerAnchorBottomPx(): number {
  const header = document.querySelector("header");
  if (header) return header.getBoundingClientRect().bottom;
  const rootStyle = getComputedStyle(document.documentElement);
  const headerRem = parseFloat(rootStyle.getPropertyValue("--header-height")) || 3.5;
  const gapRem = parseFloat(rootStyle.getPropertyValue("--layout-sticky-gap")) || 0.625;
  const rootFont = parseFloat(rootStyle.fontSize) || 16;
  return (headerRem + gapRem) * rootFont;
}

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

      if (!hasVisibleChild) {
        document.documentElement.style.setProperty("--layout-top-notice-height", "0px");
        return;
      }

      const stackRect = stack.getBoundingClientRect();
      const anchorBottom = headerAnchorBottomPx();
      const occupiedBelowHeader = Math.max(0, stackRect.bottom - anchorBottom);
      const height = occupiedBelowHeader + TOP_NOTICE_GAP_PX;

      document.documentElement.style.setProperty(
        "--layout-top-notice-height",
        `${height}px`
      );
    };

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(host);

    const stack = host.querySelector(".floating-notice-stack--top-right");
    if (stack) resizeObserver.observe(stack);

    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.documentElement.style.setProperty("--layout-top-notice-height", "0px");
    };
  }, [hostRef]);
}
