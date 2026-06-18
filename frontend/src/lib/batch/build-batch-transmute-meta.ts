import type { ResourceProfile } from "@/lib/device/resource-profile";
import type { ToolDefinition } from "@/lib/tools/types";
import { buildFileIdentity, buildTransmuteFingerprint } from "@/lib/transmutation/fingerprint";
import type { LimitContext } from "@/lib/transmutation/limit-context";
import { SOFT_LIMIT_BYTES } from "@/lib/transmutation/limits";
import type { PreparedFileContext } from "@/lib/transmutation/prepare/types";
import type {
  EncodeSource,
  OutputExtension,
  TransmutationOptions,
  WorkerRequestMeta,
} from "@/workers/types";

export function resolveToolEncodeSource(tool: ToolDefinition): EncodeSource | undefined {
  if (tool.module === "transmutador_encode" || tool.module === "transmutador_avif_encode") {
    return tool.fromFormat === "PNG" ? "png" : "jpeg";
  }
  return undefined;
}

export function buildBatchTransmuteMeta(
  file: File,
  prepared: PreparedFileContext,
  tool: ToolDefinition,
  options: TransmutationOptions,
  outputExtension: OutputExtension,
  encodeSource: EncodeSource | undefined,
  profile: ResourceProfile,
  limitContext: LimitContext,
  oversizeConsented: boolean,
  riskModeEnabled: boolean
): WorkerRequestMeta {
  const fingerprint = buildTransmuteFingerprint(
    tool.module,
    file,
    options,
    outputExtension,
    encodeSource
  );
  const fileIdentity = buildFileIdentity(file);
  const largeInput = file.size > SOFT_LIMIT_BYTES;
  const alphaAssessment = prepared.alphaAssessment;
  const alphaHint =
    alphaAssessment && alphaAssessment.confidence !== "structural"
      ? {
          hasMeaningfulAlpha: alphaAssessment.hasMeaningfulAlpha,
          confidence: alphaAssessment.confidence,
        }
      : undefined;

  return {
    fingerprint,
    fileIdentity,
    enableResultCache: profile.enableResultCache && !largeInput,
    cacheMaxOutputBytes: profile.cacheMaxOutputBytes,
    cacheMaxEntries: profile.cacheMaxEntries,
    effectiveMaxInputBytes: limitContext.sessionInputLimitBytes,
    userConsentedOversize: oversizeConsented || riskModeEnabled,
    riskModeEnabled,
    alphaHint,
  };
}
