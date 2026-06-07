"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useScrollLock(open);

  const openPalette = useCallback(() => {
    setOpen(true);
    dialogRef.current?.showModal();
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    dialogRef.current?.close();
  }, []);

  const toggle = useCallback(() => {
    if (dialogRef.current?.open) {
      closePalette();
    } else {
      openPalette();
    }
  }, [openPalette, closePalette]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => setOpen(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return { open, openPalette, closePalette, toggle, dialogRef };
}
