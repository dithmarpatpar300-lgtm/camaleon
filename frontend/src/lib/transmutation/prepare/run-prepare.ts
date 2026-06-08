import type { ToolDefinition } from "@/lib/tools/types";
import { bmpHasMeaningfulAlpha } from "@/lib/format/detect-bmp-alpha";
import { detectGifAlpha } from "@/lib/format/detect-gif-alpha";
import { detectPngAlpha } from "@/lib/format/detect-png-alpha";
import { detectWebpAlpha } from "@/lib/format/detect-webp-alpha";
import { resolveSourceImageMeta } from "@/lib/format/source-image-meta";
import { setGifSessionInputLimit, openGifSessionWithProgress } from "@/lib/gif/gif-wasm-client";
import { warmupTransmutatorModule } from "@/lib/transmutation/prepare/warmup-wasm";
import type {
  PreparedFileContext,
  PrepareOptions,
  PreparePhaseId,
  PrepareProgress,
} from "./types";

type PreparePipelinePhase = Exclude<PreparePhaseId, "transmuting" | "resizing">;

const PHASE_WEIGHT: Record<PreparePipelinePhase, number> = {
  reading: 0.08,
  engine: 0.32,
  analyze: 0.52,
  finalize: 0.08,
};

function cumulativeBefore(phase: PreparePipelinePhase): number {
  const order: PreparePipelinePhase[] = ["reading", "engine", "analyze", "finalize"];
  let sum = 0;
  for (const id of order) {
    if (id === phase) break;
    sum += PHASE_WEIGHT[id];
  }
  return sum;
}

function emit(
  onProgress: (p: PrepareProgress) => void,
  phase: PreparePipelinePhase,
  sub = 1,
  extras?: Pick<PrepareProgress, "phaseLabelKey" | "detailLabelKey" | "detailParams" | "indeterminate">
): void {
  const base = cumulativeBefore(phase);
  const progress = Math.min(1, base + PHASE_WEIGHT[phase] * sub);
  onProgress({ phase, progress, ...extras });
}

function detectAlphaForTool(toolId: string, bytes: ArrayBuffer): boolean {
  switch (toolId) {
    case "png-to-jpg":
      return detectPngAlpha(bytes).hasAlpha;
    case "webp-to-jpg":
      return detectWebpAlpha(bytes);
    case "gif-to-jpg":
      return detectGifAlpha(bytes);
    case "bmp-to-jpg":
      return bmpHasMeaningfulAlpha(bytes);
    default:
      return false;
  }
}

function isGifTool(toolId: string): boolean {
  return toolId === "gif-to-png" || toolId === "gif-to-jpg";
}

function needsAlphaScan(tool: ToolDefinition): boolean {
  return tool.optionSpecs?.some((s) => s.kind === "color" && s.key === "background") ?? false;
}

/** Yields to the main thread via rAF, allowing React to flush pending state. */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function prepareFileForTool(
  tool: ToolDefinition,
  bytes: ArrayBuffer,
  onProgress: (p: PrepareProgress) => void,
  options: PrepareOptions = {}
): Promise<PreparedFileContext> {
  const sessionLimit = options.sessionInputLimitBytes;

  // ── Phase: reading ───────────────────────────────────────────────────
  emit(onProgress, "reading", 0);
  await yieldToMain();
  emit(onProgress, "reading", 1);

  // ── Phase: engine (async Wasm module load) ───────────────────────────
  emit(onProgress, "engine", 0);
  await warmupTransmutatorModule(tool.module);
  emit(onProgress, "engine", 1);

  // ── Phase: analyze ───────────────────────────────────────────────────
  let gifSession = null;

  if (isGifTool(tool.id)) {
    emit(onProgress, "analyze", 0, {
      phaseLabelKey: "prepare.phases.analyzeGif",
      indeterminate: true,
    });
    await yieldToMain();

    if (sessionLimit != null) {
      await setGifSessionInputLimit(sessionLimit);
    }

    let lastRafFrame = 0;
    gifSession = await openGifSessionWithProgress(
      new Uint8Array(bytes),
      (current) => {
        lastRafFrame = current;
      }
    );

    emit(onProgress, "analyze", 1, {
      phaseLabelKey: "prepare.phases.analyzeGif",
      detailLabelKey: "prepare.gifFrameProgress",
      detailParams: { current: lastRafFrame || gifSession.frame_count },
    });
  } else if (needsAlphaScan(tool)) {
    emit(onProgress, "analyze", 0);
    await yieldToMain();
    detectAlphaForTool(tool.id, bytes);
    emit(onProgress, "analyze", 1);
  } else {
    emit(onProgress, "analyze", 0);
    await yieldToMain();
    emit(onProgress, "analyze", 1);
  }

  const sourceMeta = await resolveSourceImageMeta(tool, bytes, {
    gifSession,
    sessionInputLimitBytes: sessionLimit,
  });

  // ── Phase: finalize ──────────────────────────────────────────────────
  emit(onProgress, "finalize", 0);
  await yieldToMain();
  emit(onProgress, "finalize", 1);

  const hasAlpha = needsAlphaScan(tool)
    ? tool.fromFormat === "BMP"
      ? sourceMeta?.hasMeaningfulAlpha ?? bmpHasMeaningfulAlpha(bytes)
      : detectAlphaForTool(tool.id, bytes)
    : false;

  return {
    hasAlpha,
    gifSession,
    sourceMeta,
  };
}
