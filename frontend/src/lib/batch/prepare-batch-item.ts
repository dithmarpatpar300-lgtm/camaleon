import type { ToolDefinition } from "@/lib/tools/types";
import { probeJpegSourceMeta, probePngSourceMeta, probeWebpSourceMeta } from "@/lib/format/source-image-meta";
import { computeLimitContext } from "@/lib/transmutation/limit-context";
import {
  getHardLimitBytes,
  getLimitZone,
  prepareSessionInputLimit,
} from "@/lib/transmutation/limits";
import { prepareFileForTool } from "@/lib/transmutation/prepare/run-prepare";
import type { PreparedFileContext } from "@/lib/transmutation/prepare/types";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";

function fallbackSourceMeta(tool: ToolDefinition, bytes: ArrayBuffer): SourceImageMeta | null {
  switch (tool.fromFormat) {
    case "JPG":
      return probeJpegSourceMeta(bytes);
    case "PNG":
      return probePngSourceMeta(bytes);
    case "WEBP":
      return probeWebpSourceMeta(bytes);
    default:
      return null;
  }
}

function withSourceMeta(
  tool: ToolDefinition,
  bytes: ArrayBuffer,
  prepared: PreparedFileContext
): PreparedFileContext {
  if (prepared.sourceMeta) return prepared;
  const meta = fallbackSourceMeta(tool, bytes);
  if (!meta) return prepared;
  return { ...prepared, sourceMeta: meta };
}

export type PrepareBatchItemResult =
  | {
      ok: true;
      bytes: ArrayBuffer;
      prepared: PreparedFileContext;
      status: "ready" | "needs_consent" | "blocked";
      blockReason: "hard_file" | "pixels" | "consent" | null;
    }
  | {
      ok: true;
      bytes: null;
      prepared: null;
      status: "blocked";
      blockReason: "hard_file";
    }
  | { ok: false; status: "error"; message: string };

export async function prepareBatchItem(
  tool: ToolDefinition,
  file: File,
  riskModeEnabled: boolean,
  deviceMemoryGb: number | undefined
): Promise<PrepareBatchItemResult> {
  const hardLimit = getHardLimitBytes(deviceMemoryGb, riskModeEnabled);

  if (file.size > hardLimit) {
    return {
      ok: true,
      bytes: null,
      prepared: null,
      status: "blocked",
      blockReason: "hard_file",
    };
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return { ok: false, status: "error", message: "read_failed" };
  }

  const limitZone = getLimitZone(file.size, hardLimit);
  const sessionLimit = prepareSessionInputLimit(limitZone, hardLimit, riskModeEnabled);

  try {
    const prepared = withSourceMeta(
      tool,
      bytes,
      await prepareFileForTool(tool, bytes, () => {}, {
        sessionInputLimitBytes: sessionLimit,
        riskModeEnabled,
      })
    );

    const limitContext = computeLimitContext({
      fileSize: file.size,
      sourceMeta: prepared.sourceMeta,
      deviceMemoryGb,
      oversizeConsented: false,
      riskModeEnabled,
      workerReady: true,
    });

    if (limitContext.blockReason === "hard_file") {
      return {
        ok: true,
        bytes,
        prepared,
        status: "blocked",
        blockReason: "hard_file",
      };
    }

    if (limitContext.blockReason === "pixels") {
      return {
        ok: true,
        bytes,
        prepared,
        status: "blocked",
        blockReason: "pixels",
      };
    }

    if (limitContext.blockReason === "consent") {
      return {
        ok: true,
        bytes,
        prepared,
        status: "needs_consent",
        blockReason: "consent",
      };
    }

    return {
      ok: true,
      bytes,
      prepared,
      status: "ready",
      blockReason: null,
    };
  } catch {
    return { ok: false, status: "error", message: "prepare_failed" };
  }
}