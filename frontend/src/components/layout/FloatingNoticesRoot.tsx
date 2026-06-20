"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { FloatingNotices } from "@/components/layout/FloatingNotices";
import { useMobileViewport } from "@/hooks/useMobileViewport";
import { useTopFloatingNoticeOffset } from "@/hooks/useTopFloatingNoticeOffset";
import {
  demoteNoticeHosts,
  promoteNoticeHosts,
  registerFloatingNoticesLayer,
} from "@/lib/layout/floating-notices-layer";
import { subscribeModalFloatingNoticesTarget } from "@/lib/layout/modal-floating-notices-portal";

/**
 * Floating notices on `document.body`.
 * When a modal dialog is open, bottom notices portal into the dialog so they stay
 * interactive (showModal makes outside content inert — see HTML dialog + top layer).
 */
export function FloatingNoticesRoot() {
  const isMobile = useMobileViewport();
  const [modalPortalTarget, setModalPortalTarget] = useState<HTMLElement | null>(null);
  const bottomHostRef = useRef<HTMLDivElement | null>(null);
  const bottomLeftHostRef = useRef<HTMLDivElement | null>(null);
  const topHostRef = useRef<HTMLDivElement | null>(null);

  const promote = useCallback(() => {
    promoteNoticeHosts(
      bottomHostRef.current,
      topHostRef.current,
      bottomLeftHostRef.current
    );
  }, []);

  const demote = useCallback(() => {
    demoteNoticeHosts(
      bottomHostRef.current,
      topHostRef.current,
      bottomLeftHostRef.current
    );
  }, []);

  useLayoutEffect(() => {
    return registerFloatingNoticesLayer({ promote, demote });
  }, [promote, demote]);

  useLayoutEffect(() => subscribeModalFloatingNoticesTarget(setModalPortalTarget), []);

  useTopFloatingNoticeOffset(topHostRef);

  const bottomNotices = (
    <FloatingNotices variant="bottom" offlineDock={isMobile} />
  );

  const bottomHostClass = "floating-notices-bottom-host";

  return (
    <ModalPortal>
      <div ref={topHostRef} className="floating-notices-top-host">
        {!isMobile && <FloatingNotices variant="top" />}
      </div>
      {!isMobile && (
        <div ref={bottomLeftHostRef} className="floating-notices-bottom-left-host">
          <FloatingNotices variant="bottom-left" />
        </div>
      )}
      {!modalPortalTarget && (
        <div ref={bottomHostRef} className={bottomHostClass}>
          {bottomNotices}
        </div>
      )}
      {modalPortalTarget &&
        createPortal(
          <div
            ref={bottomHostRef}
            className={`${bottomHostClass} floating-notices-bottom-host--in-modal`}
          >
            {bottomNotices}
          </div>,
          modalPortalTarget
        )}
    </ModalPortal>
  );
}
