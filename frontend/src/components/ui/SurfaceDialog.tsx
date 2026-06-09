"use client";

import { forwardRef, type KeyboardEventHandler, type ReactNode, type Ref } from "react";
import { useModalDialog } from "@/hooks/useModalDialog";
import { useScrollLock } from "@/hooks/useScrollLock";
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

    useScrollLock(scrollLock && isMounted && open);

    if (!isMounted) return null;

    const dialogRef = manageOpen
      ? mergeRefs(ref, syncDialogRef)
      : (ref as Ref<HTMLDialogElement>);

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
            dismissOnBackdrop
              ? (e) => {
                  if (e.target === e.currentTarget) onClose();
                }
              : undefined
          }
          onKeyDown={onKeyDown}
        >
          {children}
        </dialog>
      </ModalPortal>
    );
  }
);
