import type { ToolDefinition } from "@/lib/tools/types";
import { computeResourceProfile } from "@/lib/device/resource-profile";
import { computeLimitContext } from "@/lib/transmutation/limit-context";
import type { PreparedFileContext } from "@/lib/transmutation/prepare/types";
import { extractWasmError } from "@/lib/wasm/extract-error";
import type {
  OutputExtension,
  TransmutationOptions,
  WorkerRequestMeta,
} from "@/workers/types";
import {
  buildBatchTransmuteMeta,
  resolveToolEncodeSource,
} from "./build-batch-transmute-meta";

export type BatchDecodeEstimateFn = (
  module: ToolDefinition["module"],
  bytes: ArrayBuffer,
  options: TransmutationOptions,
  meta: WorkerRequestMeta,
  outputExtension: OutputExtension,
  encodeSource: ReturnType<typeof resolveToolEncodeSource>
) => Promise<{ outputSize: number }>;

export async function validateBatchItemDecode(input: {
  tool: ToolDefinition;
  file: File;
  bytes: ArrayBuffer;
  prepared: PreparedFileContext;
  options: TransmutationOptions;
  deviceMemoryGb: number | undefined;
  oversizeConsented: boolean;
  riskModeEnabled: boolean;
  estimate: BatchDecodeEstimateFn;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const limitContext = computeLimitContext({
    fileSize: input.file.size,
    sourceMeta: input.prepared.sourceMeta,
    deviceMemoryGb: input.deviceMemoryGb,
    oversizeConsented: input.oversizeConsented || input.riskModeEnabled,
    riskModeEnabled: input.riskModeEnabled,
    workerReady: true,
  });

  if (!limitContext.canEstimate) {
    return { ok: true };
  }

  const outputExtension = input.tool.outputExtension as OutputExtension;
  const encodeSource = resolveToolEncodeSource(input.tool);
  const profile = computeResourceProfile(input.file.size, {
    deviceMemory: input.deviceMemoryGb,
  });
  const meta = buildBatchTransmuteMeta(
    input.file,
    input.prepared,
    input.tool,
    input.options,
    outputExtension,
    encodeSource,
    profile,
    limitContext,
    input.oversizeConsented,
    input.riskModeEnabled
  );

  try {
    await input.estimate(
      input.tool.module,
      input.bytes.slice(0),
      input.options,
      meta,
      outputExtension,
      encodeSource
    );
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && (err.message === "superseded" || err.message === "worker-recycled")) {
      return { ok: true };
    }
    return { ok: false, message: extractWasmError(err, "decode_validate_failed") };
  }
}
