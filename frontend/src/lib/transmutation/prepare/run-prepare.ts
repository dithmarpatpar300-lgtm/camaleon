import type { ToolDefinition } from "@/lib/tools/types";
import { bmpHasMeaningfulAlpha } from "@/lib/format/detect-bmp-alpha";
import { inspectBmpMeta } from "@/lib/bmp/bmp-wasm-client";
import { detectGifAlpha } from "@/lib/format/detect-gif-alpha";
import { detectPngAlpha } from "@/lib/format/detect-png-alpha";
import { detectWebpAlpha } from "@/lib/format/detect-webp-alpha";
import { exceedsEngineLimit } from "@/lib/transmutation/limits";
import { openGifSessionWithProgress } from "@/lib/gif/gif-wasm-client";
import { warmupTransmutatorModule } from "@/lib/transmutation/prepare/warmup-wasm";
import type { PreparedFileContext, PreparePhaseId, PrepareProgress } from "./types";

type PreparePipelinePhase = Exclude<PreparePhaseId, "transmuting">;

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

function isBmpTool(toolId: string): boolean {
  return toolId === "bmp-to-png" || toolId === "bmp-to-jpg";
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
  onProgress: (p: PrepareProgress) => void
): Promise<PreparedFileContext> {
  // ── Phase: reading ───────────────────────────────────────────────────
  emit(onProgress, "reading", 0);
  await yieldToMain();                // render 0 → 8 %
  emit(onProgress, "reading", 1);

  // ── Phase: engine (async Wasm module load) ───────────────────────────
  emit(onProgress, "engine", 0);
  await warmupTransmutatorModule(tool.module);   // async import → yields automatically
  emit(onProgress, "engine", 1);

  // ── Phase: analyze ───────────────────────────────────────────────────
  const overEngineLimit = exceedsEngineLimit(bytes.byteLength);
  let gifSession = null;
  let bmpMeta = null;

  if (isGifTool(tool.id)) {
    if (overEngineLimit) {
      emit(onProgress, "analyze", 0, {
        phaseLabelKey: "prepare.phases.analyzeSkippedLimit",
      });
      await yieldToMain();
      emit(onProgress, "analyze", 1, {
        phaseLabelKey: "prepare.phases.analyzeSkippedLimit",
      });
    } else {
      // Wasm decode is synchronous — show indeterminate until it finishes,
      // then emit frame-accurate detail labels.
      emit(onProgress, "analyze", 0, {
        phaseLabelKey: "prepare.phases.analyzeGif",
        indeterminate: true,
      });
      // Yield once to let React paint the indeterminate ring before Wasm blocks.
      await yieldToMain();

      let lastRafFrame = 0;
      gifSession = await openGifSessionWithProgress(
        new Uint8Array(bytes),
        (current) => {
          // Callbacks fire synchronously inside Wasm.
          // Track frame count for the detail label; actual UI batches all of these
          // into one React render after the await resolves, which is fine —
          // the indeterminate indicator already communicates activity.
          lastRafFrame = current;
        }
      );

      emit(onProgress, "analyze", 1, {
        phaseLabelKey: "prepare.phases.analyzeGif",
        detailLabelKey: "prepare.gifFrameProgress",
        detailParams: { current: lastRafFrame || gifSession.frame_count },
      });
    }
  } else if (isBmpTool(tool.id)) {
    emit(onProgress, "analyze", 0, { phaseLabelKey: "prepare.phases.analyzeBmp" });
    await yieldToMain();
    if (!overEngineLimit) {
      try {
        bmpMeta = await inspectBmpMeta(new Uint8Array(bytes));
      } catch {
        bmpMeta = null;
      }
    }
    emit(onProgress, "analyze", 1, {
      phaseLabelKey: "prepare.phases.analyzeBmp",
      detailLabelKey: bmpMeta ? "prepare.bmpMeta" : undefined,
      detailParams: bmpMeta
        ? { width: bmpMeta.width, height: bmpMeta.height, bpp: bmpMeta.bitCount }
        : undefined,
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

  // ── Phase: finalize ──────────────────────────────────────────────────
  emit(onProgress, "finalize", 0);
  await yieldToMain();                // render 92 → 100 %
  emit(onProgress, "finalize", 1);

  return {
    hasAlpha: needsAlphaScan(tool)
      ? tool.id === "bmp-to-jpg"
        ? bmpMeta?.hasMeaningfulAlpha ?? bmpHasMeaningfulAlpha(bytes)
        : detectAlphaForTool(tool.id, bytes)
      : false,
    gifSession,
    bmpMeta,
  };
}
