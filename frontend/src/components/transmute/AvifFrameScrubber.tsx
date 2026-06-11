"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AvifMeta } from "@/lib/avif/avif-wasm-client";
import { acquireAvifFramePreview } from "@/lib/imaging/frame-preview-cache";
import type { AvifFramePreviewSession } from "@/lib/imaging/frame-preview-client";
import { RgbaFrameScrubber } from "./RgbaFrameScrubber";

type AvifFrameScrubberProps = {
  bytes: Uint8Array;
  meta: AvifMeta;
  frameIndex: number;
  onFrameIndexChange: (index: number) => void;
  sessionInputLimitBytes?: number;
};

export function AvifFrameScrubber({
  bytes,
  meta,
  frameIndex,
  onFrameIndexChange,
  sessionInputLimitBytes,
}: AvifFrameScrubberProps) {
  const sessionRef = useRef<AvifFramePreviewSession | null>(null);
  const [ready, setReady] = useState(false);
  const [warming, setWarming] = useState<{ current: number; total: number } | null>(() => ({
    current: 0,
    total: meta.frameCount,
  }));
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);

    const lease = acquireAvifFramePreview(bytes, {
      maxInputBytes: sessionInputLimitBytes,
      onProgress: (current, total) => {
        if (cancelled) return;
        // Monotonic guard: never let a stale message walk the counter backwards.
        setWarming((prev) =>
          prev && prev.total === total && current < prev.current
            ? prev
            : { current, total }
        );
      },
    });

    lease.session
      .then((session) => {
        if (cancelled) return;
        sessionRef.current = session;
        setReady(true);
        setWarming(null);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setWarming(null);
        }
      });

    return () => {
      cancelled = true;
      sessionRef.current = null;
      lease.release();
    };
  }, [bytes, sessionInputLimitBytes]);

  const getFrameRgba = useCallback(
    (index: number) => {
      const session = sessionRef.current;
      if (!session) {
        return Promise.reject(new Error("AVIF preview not ready"));
      }
      return session.getFrameRgba(index);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh fetcher identity once the session resolves
    [ready]
  );

  if (loadError) {
    return null;
  }

  return (
    <RgbaFrameScrubber
      source={{
        frameCount: meta.frameCount,
        width: meta.width,
        height: meta.height,
        getFrameRgba,
        warming,
        ready,
      }}
      frameIndex={frameIndex}
      onFrameIndexChange={onFrameIndexChange}
      hintKey="panel.avifFrame.hint"
    />
  );
}
