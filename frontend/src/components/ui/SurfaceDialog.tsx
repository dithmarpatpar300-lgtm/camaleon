"use client";

import { forwardRef, type KeyboardEventHandler, type ReactNode, type Ref, useCallback, useLayoutEffect, useRef } from "react";
import { useModalDialog } from "@/hooks/useModalDialog";
import { useScrollLock } from "@/hooks/useScrollLock";
import { holdFloatingNoticesForModal } from "@/lib/layout/floating-notices-layer";
import { setModalFloatingNoticesTarget } from "@/lib/layout/modal-floating-notices-portal";
import {
  isNodeWithinFloatingNotices,
  isPointOverFloatingNotices,
} from "@/lib/layout/floating-notices-hit-test";
import { mergeRefs } from "@/lib/merge-refs";
import { cn } from "@/lib/utils";
import { ModalPortal } from "./ModalPortal";

export type SurfaceDialogKind = "default" | "palette" | "drawer";

export type SurfaceDialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Keep in DOM when closed (e.g. Command Palette). */
  forceMount?: boolean;
  /** Explicit mount flag for exit animations (e.g. What's New drawer). */
  mounted?: boolean;
  /** When false, parent controls showModal/close via ref (animated drawer). */
  manageOpen?: boolean;
  kind?: SurfaceDialogKind;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  className?: string;
  onKeyDown?: KeyboardEventHandler<HTMLDialogElement>;
  scrollLock?: boolean;
  dismissOnBackdrop?: boolean;
};

function kindClassName(kind: SurfaceDialogKind): string {
  if (kind === "palette") return "surface-dialog surface-dialog--palette";
  if (kind === "drawer") return "surface-dialog surface-dialog--drawer";
  return "surface-dialog";
}

export const SurfaceDialog = forwardRef<HTMLDialogElement, SurfaceDialogProps>(
  function SurfaceDialog(
    {
      open,
      onClose,
      children,
      forceMount = false,
      mounted,
      manageOpen = true,
      kind = "default",
      ariaLabel,
      ariaLabelledBy,
      ariaDescribedBy,
      className,
      onKeyDown,
      scrollLock = true,
      dismissOnBackdrop = true,
    },
    ref
  ) {
    const { setDialogRef: syncDialogRef } = useModalDialog(manageOpen ? open : false);
    const isMounted = forceMount || (mounted ?? open);
    const innerRef = useRef<HTMLDialogElement>(null);
    const noticesSlotRef = useRef<HTMLDivElement>(null);
    const suppressNativeLightDismiss = dismissOnBackdrop && kind === "drawer";

    useScrollLock(scrollLock && isMounted && open);

    useLayoutEffect(() => {
      if (!open) return;
      return holdFloatingNoticesForModal();
    }, [open]);

    useLayoutEffect(() => {
      if (!open || !isMounted) {
        setModalFloatingNoticesTarget(null);
        return;
      }

      let cancelled = false;
      const attach = () => {
        if (!cancelled) {
          setModalFloatingNoticesTarget(noticesSlotRef.current);
        }
      };

      attach();
      const frame = requestAnimationFrame(attach);

      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
        setModalFloatingNoticesTarget(null);
      };
    }, [open, isMounted]);

    const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDialogElement>>(
      (e) => {
        if (dismissOnBackdrop && e.key === "Escape") {
          onClose();
        }
        onKeyDown?.(e);
      },
      [dismissOnBackdrop, onClose, onKeyDown]
    );

    useLayoutEffect(() => {
      const dialog = innerRef.current;
      if (!dialog || !open) return;
      if (suppressNativeLightDismiss) {
        dialog.setAttribute("closedby", "none");
      } else {
        dialog.removeAttribute("closedby");
      }
    }, [open, suppressNativeLightDismiss]);

    if (!isMounted) return null;

    const dialogRef = manageOpen
      ? mergeRefs(ref, syncDialogRef, innerRef)
      : mergeRefs(ref as Ref<HTMLDialogElement>, innerRef);

    const isDrawer = kind === "drawer";

    return (
      <ModalPortal>
        <dialog
          ref={dialogRef}
          className={cn(kindClassName(kind), className)}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-modal="true"
          onClose={onClose}
          onClick={
            dismissOnBackdrop && !isDrawer
              ? (e) => {
                  if (isPointOverFloatingNotices(e.clientX, e.clientY)) return;
                  if (isNodeWithinFloatingNotices(e.target)) return;
                  if (e.target === e.currentTarget) onClose();
                }
              : undefined
          }
          onKeyDown={handleKeyDown}
        >
          <div
            ref={noticesSlotRef}
            className="surface-modal-notices-slot"
            data-floating-notices-modal-slot
          />
          {isDrawer && dismissOnBackdrop && (
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className="surface-drawer-dismiss-scrim"
              onClick={(e) => {
                if (isPointOverFloatingNotices(e.clientX, e.clientY)) return;
                onClose();
              }}
            />
          )}
          {children}
        </dialog>
      </ModalPortal>
    );
  }
);
