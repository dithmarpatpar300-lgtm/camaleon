"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  estimateFilenameCharCapacity,
  truncateFilenameMiddle,
} from "@/lib/format/filename";

type DisplayFilenameProps = {
  name: string;
  className?: string;
  /** Fallback when container width is not yet measured. */
  fallbackMaxLength?: number;
};

/**
 * Responsive filename display: middle-ellipsis truncation based on available
 * width. Full name is always available via native `title` tooltip on hover.
 */
export function DisplayFilename({
  name,
  className,
  fallbackMaxLength = 40,
}: DisplayFilenameProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() =>
    truncateFilenameMiddle(name, fallbackMaxLength)
  );

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth;
      if (width <= 0) {
        setDisplay(truncateFilenameMiddle(name, fallbackMaxLength));
        return;
      }
      const style = getComputedStyle(el);
      const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const capacity = estimateFilenameCharCapacity(width, font);
      setDisplay(truncateFilenameMiddle(name, capacity));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [name, fallbackMaxLength]);

  return (
    <span
      ref={containerRef}
      className={cn("block min-w-0 max-w-full", className)}
      title={name}
    >
      {display}
    </span>
  );
}
