"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { FloatingNotices } from "@/components/layout/FloatingNotices";
import { useTopFloatingNoticeOffset } from "@/hooks/useTopFloatingNoticeOffset";
import {
  demoteNoticeHosts,
  promoteNoticeHosts,
  registerFloatingNoticesLayer,
} from "@/lib/layout/floating-notices-layer";

/**
 * Floating notices on `document.body` (always visible via z-index).
 * When a toast fires while a modal is open, hosts promote to the top layer
 * via `popover="manual"` — scoped to top/bottom strips, not full-screen, so
 * modal `::backdrop` blur stays intact.
 */
export function FloatingNoticesRoot() {
  const bottomHostRef = useRef<HTMLDivElement | null>(null);
  const bottomLeftHostRef = useRef<HTMLDivElement | null>(null);
  const topHostRef = useRef<HTMLDivElement | null>(null);

  const promote = useCallback(() => {
    promoteNoticeHosts(bottomHostRef.current, topHostRef.current);
  }, []);

  const demote = useCallback(() => {
    demoteNoticeHosts(bottomHostRef.current, topHostRef.current);
  }, []);

  useLayoutEffect(() => {
    return registerFloatingNoticesLayer({ promote, demote });
  }, [promote, demote]);

  useTopFloatingNoticeOffset(topHostRef);

  return (
    <ModalPortal>
      <div ref={topHostRef} className="floating-notices-top-host">
        <FloatingNotices variant="top" />
      </div>
      <div ref={bottomLeftHostRef} className="floating-notices-bottom-left-host">
        <FloatingNotices variant="bottom-left" />
      </div>
      <div ref={bottomHostRef} className="floating-notices-bottom-host">
        <FloatingNotices variant="bottom" />
      </div>
    </ModalPortal>
  );
}
