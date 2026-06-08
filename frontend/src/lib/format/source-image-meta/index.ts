import type { ToolDefinition } from "@/lib/tools/types";
import type { GifSessionHandle } from "@/lib/gif/gif-wasm-client";
import { inspectBmpMeta, setBmpSessionInputLimit } from "@/lib/bmp/bmp-wasm-client";
import { setGifSessionInputLimit } from "@/lib/gif/gif-wasm-client";
import type { SourceImageMeta } from "./types";
import {
  probeGifSourceMeta,
  probeJpegSourceMeta,
  probePngSourceMeta,
  probeWebpSourceMeta,
} from "./probes";

export type ResolveSourceMetaContext = {
  gifSession: GifSessionHandle | null;
  /** When set, temporarily raises Wasm input limit for header/decode probes during prepare. */
  sessionInputLimitBytes?: number;
};

export async function resolveSourceImageMeta(
  tool: ToolDefinition,
  bytes: ArrayBuffer,
  ctx: ResolveSourceMetaContext = { gifSession: null }
): Promise<SourceImageMeta | null> {
  const format = tool.fromFormat;

  if (ctx.sessionInputLimitBytes != null) {
    if (format === "BMP") await setBmpSessionInputLimit(ctx.sessionInputLimitBytes);
    if (format === "GIF") await setGifSessionInputLimit(ctx.sessionInputLimitBytes);
  }

  switch (format) {
    case "PNG":
      return probePngSourceMeta(bytes);
    case "JPG":
      return probeJpegSourceMeta(bytes);
    case "WEBP":
      return probeWebpSourceMeta(bytes);
    case "GIF": {
      if (ctx.gifSession) {
        return {
          width: ctx.gifSession.width,
          height: ctx.gifSession.height,
          bitDepthLabel: "8-bit",
          frameCount: ctx.gifSession.frame_count,
        };
      }
      return probeGifSourceMeta(bytes);
    }
    case "BMP": {
      try {
        const meta = await inspectBmpMeta(new Uint8Array(bytes));
        return {
          width: meta.width,
          height: meta.height,
          bitDepthLabel: `${meta.bitCount}-bit`,
          hasMeaningfulAlpha: meta.hasMeaningfulAlpha,
        };
      } catch {
        return null;
      }
    }
    default:
      return null;
  }
}

export function formatSourceImageMetaLine(meta: SourceImageMeta): string {
  if (meta.frameCount != null && meta.frameCount > 1) {
    return `${meta.width} × ${meta.height} · ${meta.bitDepthLabel} · ${meta.frameCount} frames`;
  }
  return `${meta.width} × ${meta.height} · ${meta.bitDepthLabel}`;
}

export type { SourceImageMeta } from "./types";
export {
  probeGifSourceMeta,
  probeJpegSourceMeta,
  probePngSourceMeta,
  probeWebpSourceMeta,
} from "./probes";
