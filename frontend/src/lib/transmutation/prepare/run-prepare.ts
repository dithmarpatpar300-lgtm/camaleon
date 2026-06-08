import type { ToolDefinition } from "@/lib/tools/types";
import { resolveSourceImageMeta } from "@/lib/format/source-image-meta";
import { setGifSessionInputLimit, openGifSessionWithProgress } from "@/lib/gif/gif-wasm-client";
import { inspectIcoMeta, setIcoSessionInputLimit } from "@/lib/ico/ico-wasm-client";
import { assessSemanticAlpha, needsSemanticAlpha } from "@/lib/semantic-alpha";
import { inspectTiffMeta, setTiffSessionInputLimit } from "@/lib/tiff/tiff-wasm-client";
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

function isGifTool(toolId: string): boolean {
  return toolId === "gif-to-png" || toolId === "gif-to-jpg";
}

function isTiffTool(toolId: string): boolean {
  return toolId === "tiff-to-png" || toolId === "tiff-to-jpg";
}

function isIcoTool(toolId: string): boolean {
  return toolId === "ico-to-png";
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
  let tiffMeta = null;
  let icoMeta = null;
  let alphaAssessment = null;

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
  } else if (isTiffTool(tool.id)) {
    emit(onProgress, "analyze", 0);
    await yieldToMain();
    if (sessionLimit != null) {
      await setTiffSessionInputLimit(sessionLimit);
    }
    tiffMeta = await inspectTiffMeta(new Uint8Array(bytes));
    emit(onProgress, "analyze", 1);
  } else if (isIcoTool(tool.id)) {
    emit(onProgress, "analyze", 0);
    await yieldToMain();
    if (sessionLimit != null) {
      await setIcoSessionInputLimit(sessionLimit);
    }
    icoMeta = await inspectIcoMeta(new Uint8Array(bytes));
    emit(onProgress, "analyze", 1);
  } else {
    emit(onProgress, "analyze", 0);
    await yieldToMain();
    emit(onProgress, "analyze", 1);
  }

  if (needsSemanticAlpha(tool)) {
    alphaAssessment = await assessSemanticAlpha(tool, bytes, { pageIndex: 0 });
  }

  const sourceMeta = await resolveSourceImageMeta(tool, bytes, {
    gifSession,
    tiffMeta,
    tiffPageIndex: 0,
    icoMeta,
    icoEntryIndex: icoMeta?.defaultEntryIndex ?? 0,
    alphaAssessment,
    sessionInputLimitBytes: sessionLimit,
  });

  // ── Phase: finalize ──────────────────────────────────────────────────
  emit(onProgress, "finalize", 0);
  await yieldToMain();
  emit(onProgress, "finalize", 1);

  const hasAlpha = alphaAssessment?.hasMeaningfulAlpha ?? false;

  return {
    hasAlpha,
    alphaAssessment,
    gifSession,
    tiffMeta,
    icoMeta,
    sourceMeta,
  };
}
