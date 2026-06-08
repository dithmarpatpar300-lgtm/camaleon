import type { ToolDefinition } from "@/lib/tools/types";
import type { GifSessionHandle } from "@/lib/gif/gif-wasm-client";
import { inspectBmpMeta, setBmpSessionInputLimit } from "@/lib/bmp/bmp-wasm-client";
import { setGifSessionInputLimit } from "@/lib/gif/gif-wasm-client";
import {
  inspectIcoMeta,
  icoMetaForEntry,
  setIcoSessionInputLimit,
  type IcoMeta,
} from "@/lib/ico/ico-wasm-client";
import {
  formatTgaBitDepthLabel,
  inspectTgaMeta,
  setTgaSessionInputLimit,
} from "@/lib/tga/tga-wasm-client";
import {
  inspectTiffMeta,
  setTiffSessionInputLimit,
  tiffMetaForPage,
  type TiffMeta,
} from "@/lib/tiff/tiff-wasm-client";
import type { AlphaAssessment } from "@/lib/semantic-alpha";
import type { SourceImageMeta } from "./types";
import {
  probeGifSourceMeta,
  probeJpegSourceMeta,
  probePngSourceMeta,
  probeWebpSourceMeta,
} from "./probes";

export type ResolveSourceMetaContext = {
  gifSession: GifSessionHandle | null;
  tiffMeta?: TiffMeta | null;
  tiffPageIndex?: number;
  icoMeta?: IcoMeta | null;
  icoEntryIndex?: number;
  /** From Semantic Alpha Engine when tool has background flatten option. */
  alphaAssessment?: AlphaAssessment | null;
  /** When set, temporarily raises Wasm input limit for header/decode probes during prepare. */
  sessionInputLimitBytes?: number;
};

function withSemanticAlpha(
  meta: SourceImageMeta | null,
  alphaAssessment?: AlphaAssessment | null
): SourceImageMeta | null {
  if (!meta) return null;
  if (!alphaAssessment) return meta;
  return {
    ...meta,
    hasMeaningfulAlpha: alphaAssessment.hasMeaningfulAlpha,
  };
}

export async function resolveSourceImageMeta(
  tool: ToolDefinition,
  bytes: ArrayBuffer,
  ctx: ResolveSourceMetaContext = { gifSession: null }
): Promise<SourceImageMeta | null> {
  const format = tool.fromFormat;

  if (ctx.sessionInputLimitBytes != null) {
    if (format === "BMP") await setBmpSessionInputLimit(ctx.sessionInputLimitBytes);
    if (format === "GIF") await setGifSessionInputLimit(ctx.sessionInputLimitBytes);
    if (format === "TIFF") await setTiffSessionInputLimit(ctx.sessionInputLimitBytes);
    if (format === "ICO") await setIcoSessionInputLimit(ctx.sessionInputLimitBytes);
    if (format === "TGA") await setTgaSessionInputLimit(ctx.sessionInputLimitBytes);
  }

  switch (format) {
    case "PNG":
      return withSemanticAlpha(probePngSourceMeta(bytes), ctx.alphaAssessment);
    case "JPG":
      return probeJpegSourceMeta(bytes);
    case "WEBP":
      return withSemanticAlpha(probeWebpSourceMeta(bytes), ctx.alphaAssessment);
    case "GIF": {
      if (ctx.gifSession) {
        return withSemanticAlpha(
          {
            width: ctx.gifSession.width,
            height: ctx.gifSession.height,
            bitDepthLabel: "8-bit",
            frameCount: ctx.gifSession.frame_count,
          },
          ctx.alphaAssessment
        );
      }
      return withSemanticAlpha(probeGifSourceMeta(bytes), ctx.alphaAssessment);
    }
    case "BMP": {
      try {
        const meta = await inspectBmpMeta(new Uint8Array(bytes));
        return withSemanticAlpha(
          {
            width: meta.width,
            height: meta.height,
            bitDepthLabel: `${meta.bitCount}-bit`,
          },
          ctx.alphaAssessment
        );
      } catch {
        return null;
      }
    }
    case "TIFF": {
      if (ctx.tiffMeta) {
        const pageIndex = ctx.tiffPageIndex ?? 0;
        const page = tiffMetaForPage(ctx.tiffMeta, pageIndex);
        return withSemanticAlpha(
          {
            width: page.width,
            height: page.height,
            bitDepthLabel: page.bitDepthLabel,
            pageCount: page.pageCount > 1 ? page.pageCount : undefined,
          },
          ctx.alphaAssessment
        );
      }
      try {
        const meta = await inspectTiffMeta(new Uint8Array(bytes));
        const page = tiffMetaForPage(meta, 0);
        return withSemanticAlpha(
          {
            width: page.width,
            height: page.height,
            bitDepthLabel: page.bitDepthLabel,
            pageCount: page.pageCount > 1 ? page.pageCount : undefined,
          },
          ctx.alphaAssessment
        );
      } catch {
        return null;
      }
    }
    case "TGA": {
      try {
        const meta = await inspectTgaMeta(new Uint8Array(bytes));
        return withSemanticAlpha(
          {
            width: meta.width,
            height: meta.height,
            bitDepthLabel: formatTgaBitDepthLabel(meta),
          },
          ctx.alphaAssessment
        );
      } catch {
        return null;
      }
    }
    case "ICO": {
      const entryIndex = ctx.icoEntryIndex ?? ctx.icoMeta?.defaultEntryIndex ?? 0;
      if (ctx.icoMeta) {
        const entry = icoMetaForEntry(ctx.icoMeta, entryIndex);
        return {
          width: entry.width,
          height: entry.height,
          bitDepthLabel: entry.bitDepthLabel,
          entryCount: entry.entryCount > 1 ? entry.entryCount : undefined,
        };
      }
      try {
        const meta = await inspectIcoMeta(new Uint8Array(bytes));
        const entry = icoMetaForEntry(meta, meta.defaultEntryIndex);
        return {
          width: entry.width,
          height: entry.height,
          bitDepthLabel: entry.bitDepthLabel,
          entryCount: entry.entryCount > 1 ? entry.entryCount : undefined,
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
  if (meta.pageCount != null && meta.pageCount > 1) {
    return `${meta.width} × ${meta.height} · ${meta.bitDepthLabel} · ${meta.pageCount} pages`;
  }
  if (meta.entryCount != null && meta.entryCount > 1) {
    return `${meta.width} × ${meta.height} · ${meta.bitDepthLabel} · ${meta.entryCount} sizes`;
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
