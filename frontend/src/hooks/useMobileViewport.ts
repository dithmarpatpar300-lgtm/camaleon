"use client";

import { useEffect, useState } from "react";

const MOBILE_MAX_WIDTH_PX = 639;

/** True when viewport width is mobile (< 640px), matching Tailwind `sm` breakpoint. */
export function useMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);

    const sync = () => setIsMobile(media.matches);
    sync();

    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
}
