"use client";

import { useEffect, useState } from "react";
import {
  TOAST_MAX_VISIBLE_DESKTOP,
  TOAST_MAX_VISIBLE_MOBILE,
  TOAST_MOBILE_MAX_WIDTH_PX,
  getToastMaxVisibleForViewportWidth,
} from "./constants";

/** Live max visible toast slots — 3 desktop, 2 mobile (matches sm breakpoint). */
export function useToastMaxVisible(): number {
  const [maxVisible, setMaxVisible] = useState(TOAST_MAX_VISIBLE_DESKTOP);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${TOAST_MOBILE_MAX_WIDTH_PX}px)`);
    const apply = () => {
      setMaxVisible(getToastMaxVisibleForViewportWidth(window.innerWidth));
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return maxVisible;
}
