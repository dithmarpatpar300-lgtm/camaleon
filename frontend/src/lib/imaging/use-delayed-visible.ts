"use client";

import { useEffect, useState } from "react";

/** Shows `visible` only after it stays true for `delayMs` — avoids flash on fast paths. */
export function useDelayedVisible(active: boolean, delayMs = 150): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return shown;
}
