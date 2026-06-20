"use client";

import { useLayoutEffect } from "react";
import { ensureClientStorageSeeded } from "@/lib/storage/seed-storage";

/** Safety net after hydration — bootstrap script seeds before paint; this catches edge cases. */
export function ClientStorageSeed() {
  useLayoutEffect(() => {
    ensureClientStorageSeeded();
  }, []);

  return null;
}
