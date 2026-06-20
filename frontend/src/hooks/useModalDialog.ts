"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { refreshFloatingNoticesLayer } from "@/lib/layout/floating-notices-layer";

/**
 * Syncs a native `<dialog>` with a React `open` flag.
 * Uses a ref callback so `showModal()` runs as soon as the node mounts in a
 * portal — avoids the race where `useEffect` runs before `ModalPortal` paints.
 */
export function useModalDialog(open: boolean) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const setDialogRef = useCallback(
    (node: HTMLDialogElement | null) => {
      dialogRef.current = node;
      if (node && open && !node.open) {
        node.showModal();
        refreshFloatingNoticesLayer();
      }
    },
    [open]
  );

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      refreshFloatingNoticesLayer();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return { dialogRef, setDialogRef };
}
