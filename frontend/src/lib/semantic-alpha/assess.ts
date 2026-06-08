import { ensureBmpWasm } from "@/lib/bmp/bmp-wasm-client";
import { ensureGifWasm } from "@/lib/gif/gif-wasm-client";
import { ensureTiffWasm } from "@/lib/tiff/tiff-wasm-client";
import { importWasmGlue } from "@/lib/wasm/load-glue";
import type { ToolDefinition } from "@/lib/tools/types";
import {
  wrapAlphaAssessment,
  type AlphaAssessment,
  type AlphaAssessmentHandle,
} from "./types";

export type SemanticAlphaContext = {
  pageIndex?: number;
};

type AssessWasmModule = {
  assess_alpha: (input: Uint8Array) => AlphaAssessmentHandle;
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

export async function assessSemanticAlpha(
  tool: ToolDefinition,
  bytes: ArrayBuffer,
  ctx: SemanticAlphaContext = {}
): Promise<AlphaAssessment> {
  const input = new Uint8Array(bytes);

  switch (tool.fromFormat) {
    case "PNG": {
      const wasm = await ensurePngWasm();
      return wrapAlphaAssessment(wasm.assess_alpha(input));
    }
    case "WEBP": {
      const wasm = await ensureWebpWasm();
      return wrapAlphaAssessment(wasm.assess_alpha(input));
    }
    case "GIF": {
      const wasm = await ensureGifWasm();
      return wrapAlphaAssessment(
        (wasm as unknown as AssessWasmModule).assess_alpha(input)
      );
    }
    case "BMP": {
      const wasm = await ensureBmpWasm();
      return wrapAlphaAssessment(
        (wasm as unknown as AssessWasmModule).assess_alpha(input)
      );
    }
    case "TIFF": {
      const wasm = await ensureTiffWasm();
      const pageIndex = ctx.pageIndex ?? 0;
      return wrapAlphaAssessment(
        (
          wasm as unknown as AssessWasmModule & {
            assess_page_alpha: (input: Uint8Array, pageIndex: number) => AlphaAssessmentHandle;
          }
        ).assess_page_alpha(input, pageIndex)
      );
    }
    default:
      return {
        hasAlphaChannel: false,
        hasMeaningfulAlpha: false,
        confidence: "none",
      };
  }
}
