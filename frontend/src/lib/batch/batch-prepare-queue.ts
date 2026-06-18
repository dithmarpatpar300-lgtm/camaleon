import type { ToolDefinition } from "@/lib/tools/types";
import { releasePreparedContext } from "@/lib/transmutation/prepare/types";
import type { TransmutationOptions } from "@/workers/types";
import type { BatchDecodeEstimateFn } from "./batch-decode-validate";
import { validateBatchItemDecode } from "./batch-decode-validate";
import type { BatchItem, BatchItemPatch } from "./batch-types";
import { prepareBatchItem } from "./prepare-batch-item";

export type BatchPrepareProgress = {
  current: number;
  total: number;
  fileName: string;
};

export type BatchPrepareValidateContext = {
  options: TransmutationOptions;
  estimate: BatchDecodeEstimateFn;
};

export function releaseBatchItemPrepared(item: BatchItem): void {
  releasePreparedContext(item.prepared);
}

const RASTER_META_FORMATS = new Set(["JPG", "PNG", "WEBP"]);

export async function runBatchPrepareQueue(
  items: BatchItem[],
  tool: ToolDefinition,
  riskModeEnabled: boolean,
  deviceMemoryGb: number | undefined,
  onProgress: (progress: BatchPrepareProgress) => void,
  onPatch: (id: string, patch: BatchItemPatch) => void,
  isCancelled: () => boolean,
  validateContext?: BatchPrepareValidateContext
): Promise<void> {
  const total = items.length;
  for (let i = 0; i < items.length; i++) {
    if (isCancelled()) break;
    const item = items[i];
    onProgress({ current: i + 1, total, fileName: item.file.name });
    onPatch(item.id, { status: "preparing", errorMessage: null });

    const result = await prepareBatchItem(tool, item.file, riskModeEnabled, deviceMemoryGb);
    if (isCancelled()) {
      if (result.ok && result.prepared) releasePreparedContext(result.prepared);
      break;
    }

    if (!result.ok) {
      onPatch(item.id, {
        status: "error",
        errorMessage: result.message,
        prepared: null,
        bytes: null,
        sourceMeta: null,
        selected: false,
      });
      continue;
    }

    if (result.status === "blocked") {
      onPatch(item.id, {
        bytes: result.bytes,
        prepared: result.prepared,
        sourceMeta: result.prepared?.sourceMeta ?? null,
        status: "blocked",
        blockReason: result.blockReason,
        selected: false,
      });
      continue;
    }

    if (result.status === "needs_consent") {
      onPatch(item.id, {
        bytes: result.bytes,
        prepared: result.prepared,
        sourceMeta: result.prepared?.sourceMeta ?? null,
        status: "needs_consent",
        blockReason: "consent",
      });
      continue;
    }

    if (
      RASTER_META_FORMATS.has(tool.fromFormat) &&
      !result.prepared?.sourceMeta
    ) {
      onPatch(item.id, {
        bytes: result.bytes,
        prepared: result.prepared,
        sourceMeta: null,
        status: "error",
        errorMessage: "errors.corrupt",
        selected: false,
      });
      continue;
    }

    if (validateContext && result.bytes && result.prepared) {
      const decodeCheck = await validateBatchItemDecode({
        tool,
        file: item.file,
        bytes: result.bytes,
        prepared: result.prepared,
        options: validateContext.options,
        deviceMemoryGb,
        oversizeConsented: false,
        riskModeEnabled,
        estimate: validateContext.estimate,
      });
      if (isCancelled()) break;

      if (!decodeCheck.ok) {
        onPatch(item.id, {
          bytes: result.bytes,
          prepared: result.prepared,
          sourceMeta: result.prepared.sourceMeta ?? null,
          status: "error",
          errorMessage: decodeCheck.message,
          selected: true,
        });
        continue;
      }
    }

    onPatch(item.id, {
      bytes: result.bytes,
      prepared: result.prepared,
      sourceMeta: result.prepared?.sourceMeta ?? null,
      status: "ready",
      blockReason: null,
      errorMessage: null,
    });
  }
}
