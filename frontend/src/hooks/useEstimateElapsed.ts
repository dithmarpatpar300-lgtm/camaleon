"use client";

import { useEffect, useState } from "react";

/** Elapsed milliseconds while `estimating` is true; resets when estimate completes. */
export function useEstimateElapsed(estimating: boolean): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!estimating) {
      setElapsedMs(0);
      return;
    }

    const startedAt = Date.now();
    setElapsedMs(0);
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 500);

    return () => window.clearInterval(timer);
  }, [estimating]);

  return elapsedMs;
}
