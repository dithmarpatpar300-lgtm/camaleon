import { ensureAvifWasm } from "@/lib/avif/avif-wasm-client";
import { ensureBmpWasm } from "@/lib/bmp/bmp-wasm-client";
import { ensureGifWasm } from "@/lib/gif/gif-wasm-client";
import { ensureSvgWasm } from "@/lib/svg/svg-wasm-client";
import { ensureTiffWasm } from "@/lib/tiff/tiff-wasm-client";
import { importWasmGlue } from "@/lib/wasm/load-glue";
import { sessionLimitForBytes } from "@/lib/transmutation/limits";
import { syncWasmRiskMode } from "@/lib/wasm/risk-mode-sync";
import type { ToolDefinition } from "@/lib/tools/types";
import {
  wrapAlphaAssessment,
  type AlphaAssessment,
  type AlphaAssessmentHandle,
} from "./types";

export type SemanticAlphaContext = {
  pageIndex?: number;
  /** Override Wasm session ceiling; otherwise derived from `bytes` length. */
  sessionInputLimitBytes?: number;
  deviceMemoryGb?: number;
  riskModeEnabled?: boolean;
};

function resolveAssessSessionLimit(
  bytes: ArrayBuffer,
  ctx: SemanticAlphaContext
): number {
  if (ctx.sessionInputLimitBytes != null && ctx.sessionInputLimitBytes > 0) {
    return ctx.sessionInputLimitBytes;
  }
  return sessionLimitForBytes(bytes.byteLength, ctx.deviceMemoryGb);
}

type AssessWasmModule = {
  assess_alpha: (input: Uint8Array) => AlphaAssessmentHandle;
  set_session_input_limit?: (maxBytes: number) => void;
};

async function ensurePngWasm(): Promise<AssessWasmModule> {
  const module = await importWasmGlue("transmutador_png");
  await module.default();
  return module as unknown as AssessWasmModule;
}

async function ensureWebpWasm(): Promise<AssessWasmModule> {
  const module = await importWasmGlue("transmutador_webp");
  await module.default();
  return module as unknown as AssessWasmModule;
}

function applyLimit(wasm: AssessWasmModule, limitBytes?: number): void {
  if (limitBytes != null && limitBytes > 0) {
    wasm.set_session_input_limit?.(limitBytes);
  }
}

export async function assessSemanticAlpha(
  tool: ToolDefinition,
  bytes: ArrayBuffer,
  ctx: SemanticAlphaContext = {}
): Promise<AlphaAssessment> {
  const input = new Uint8Array(bytes);
  const limit = resolveAssessSessionLimit(bytes, ctx);
  const riskMode = ctx.riskModeEnabled === true;

  if (riskMode) {
    await syncWasmRiskMode(tool.module, true);
  }

  switch (tool.fromFormat) {
    case "PNG": {
      const wasm = await ensurePngWasm();
      applyLimit(wasm, limit);
      return wrapAlphaAssessment(wasm.assess_alpha(input));
    }
    case "WEBP": {
      const wasm = await ensureWebpWasm();
      applyLimit(wasm, limit);
      return wrapAlphaAssessment(wasm.assess_alpha(input));
    }
    case "GIF": {
      const wasm = await ensureGifWasm();
      applyLimit(wasm as unknown as AssessWasmModule, limit);
      return wrapAlphaAssessment(
        (wasm as unknown as AssessWasmModule).assess_alpha(input)
      );
    }
    case "BMP": {
      const wasm = await ensureBmpWasm();
      applyLimit(wasm as unknown as AssessWasmModule, limit);
      return wrapAlphaAssessment(
        (wasm as unknown as AssessWasmModule).assess_alpha(input)
      );
    }
    case "TIFF": {
      const wasm = await ensureTiffWasm();
      applyLimit(wasm as unknown as AssessWasmModule, limit);
      const pageIndex = ctx.pageIndex ?? 0;
      return wrapAlphaAssessment(
        (
          wasm as unknown as AssessWasmModule & {
            assess_page_alpha: (input: Uint8Array, pageIndex: number) => AlphaAssessmentHandle;
          }
        ).assess_page_alpha(input, pageIndex)
      );
    }
    case "AVIF": {
      const wasm = await ensureAvifWasm();
      applyLimit(wasm as unknown as AssessWasmModule, limit);
      return wrapAlphaAssessment(
        (wasm as unknown as AssessWasmModule).assess_alpha(input)
      );
    }
    case "SVG": {
      const wasm = await ensureSvgWasm();
      applyLimit(wasm as unknown as AssessWasmModule, limit);
      const meaningful = (
        wasm as unknown as AssessWasmModule & {
          assess_svg_meaningful_alpha: (input: Uint8Array) => boolean;
        }
      ).assess_svg_meaningful_alpha(input);
      return {
        hasAlphaChannel: meaningful,
        hasMeaningfulAlpha: meaningful,
        confidence: meaningful ? "sampled" : "none",
      };
    }
    default:
      return {
        hasAlphaChannel: false,
        hasMeaningfulAlpha: false,
        confidence: "none",
      };
  }
}
