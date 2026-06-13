import type { ToolDefinition } from "@/lib/tools/types";
import type {
  EncodeSource,
  OutputExtension,
  TransmutationModule,
} from "@/workers/types";

export type PostResizeWasmConfig = {
  module: TransmutationModule;
  outputExtension: OutputExtension;
  encodeSource?: EncodeSource;
};

/**
 * After client downscale, bytes are always PNG. Map the user's tool to a Wasm
 * route that accepts PNG input.
 */
export function resolvePostResizeWasmConfig(
  tool: ToolDefinition
): PostResizeWasmConfig | null {
  const out = tool.outputExtension as OutputExtension;
  if (out === "jpg") {
    return { module: "transmutador_png", outputExtension: "jpg" };
  }
  if (out === "webp") {
    return {
      module: "transmutador_encode",
      outputExtension: "webp",
      encodeSource: "png",
    };
  }
  if (out === "avif") {
    return {
      module: "transmutador_avif_encode",
      outputExtension: "avif",
      encodeSource: "png",
    };
  }
  return null;
}

export function supportsClientResize(tool: ToolDefinition): boolean {
  const resizable = new Set(["PNG", "JPG", "WEBP", "BMP", "TIFF", "TGA"]);
  if (!resizable.has(tool.fromFormat)) return false;
  return resolvePostResizeWasmConfig(tool) != null;
}
