"use client";

import { useCallback } from "react";
import type { RgbaFrameSession } from "./RgbaFrameScrubber";
import { RgbaFrameScrubber } from "./RgbaFrameScrubber";

type GifFrameScrubberProps = {
  session: RgbaFrameSession;
  frameIndex: number;
  onFrameIndexChange: (index: number) => void;
};

export function GifFrameScrubber({
  session,
  frameIndex,
  onFrameIndexChange,
}: GifFrameScrubberProps) {
  const getFrameRgba = useCallback(
    (index: number) => Promise.resolve(session.frame_rgba(index)),
    [session]
  );

  return (
    <RgbaFrameScrubber
      source={{
        frameCount: session.frame_count,
        width: session.width,
        height: session.height,
        getFrameRgba,
        ready: true,
      }}
      frameIndex={frameIndex}
      onFrameIndexChange={onFrameIndexChange}
    />
  );
}

export type { RgbaFrameSession };
