import type { ToolDefinition } from "@/lib/tools/types";
import { resolveSourceImageMeta } from "@/lib/format/source-image-meta";
import { setGifSessionInputLimit, openGifSessionWithProgress } from "@/lib/gif/gif-wasm-client";
import { inspectIcoMeta, setIcoSessionInputLimit } from "@/lib/ico/ico-wasm-client";
import { assessSemanticAlpha, needsSemanticAlpha } from "@/lib/semantic-alpha";
import {
  inspectAvifMeta,
  setAvifSessionInputLimit,
  type AvifMeta,
} from "@/lib/avif/avif-wasm-client";
import { inspectTiffMeta, setTiffSessionInputLimit } from "@/lib/tiff/tiff-wasm-client";
import {
  MAX_PIXELS,
  pixelCountFromMeta,
} from "@/lib/transmutation/limit-context";
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

function isAvifTool(toolId: string): boolean {
  return toolId === "avif-to-png";
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
  let avifMeta = null;

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
  } else if (isAvifTool(tool.id)) {
    emit(onProgress, "analyze", 0, {
      phaseLabelKey: "prepare.phases.analyzeAvif",
      indeterminate: true,
    });
    await yieldToMain();
    if (sessionLimit != null) {
      await setAvifSessionInputLimit(sessionLimit);
    }
    avifMeta = await inspectAvifMeta(new Uint8Array(bytes));
    // Animated AVIF: metadata + decode probe only — frame previews load lazily (non-blocking).
    emit(onProgress, "analyze", 1);
  } else {
    emit(onProgress, "analyze", 0);
    await yieldToMain();
    emit(onProgress, "analyze", 1);
  }

  // Header/metadata probe first — must not full-decode above MAX_PIXELS (astro path).
  let sourceMeta = await resolveSourceImageMeta(tool, bytes, {
    gifSession,
    avifMeta,
    tiffMeta,
    tiffPageIndex: 0,
    icoMeta,
    icoEntryIndex: icoMeta?.defaultEntryIndex ?? 0,
    sessionInputLimitBytes: sessionLimit,
  });

  const pixelCount = pixelCountFromMeta(sourceMeta);
  const exceedsPixelLimit = pixelCount != null && pixelCount > MAX_PIXELS;

  if (needsSemanticAlpha(tool) && !exceedsPixelLimit) {
    try {
      alphaAssessment = await assessSemanticAlpha(tool, bytes, {
        pageIndex: 0,
        sessionInputLimitBytes: sessionLimit ?? undefined,
      });
      if (sourceMeta && alphaAssessment) {
        sourceMeta = {
          ...sourceMeta,
          hasMeaningfulAlpha: alphaAssessment.hasMeaningfulAlpha,
        };
      }
    } catch {
      // Dimension guard or decode failure — proceed; user may still resize.
    }
  }

  // ── Phase: finalize ──────────────────────────────────────────────────
  emit(onProgress, "finalize", 0);
  await yieldToMain();
  emit(onProgress, "finalize", 1);

  const hasAlpha = alphaAssessment?.hasMeaningfulAlpha ?? false;

  return {
    hasAlpha,
    alphaAssessment,
    gifSession,
    avifMeta,
    tiffMeta,
    icoMeta,
    sourceMeta,
  };
}
