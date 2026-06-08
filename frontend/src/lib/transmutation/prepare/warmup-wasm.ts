import type { TransmutationModule } from "@/workers/types";
import { ensureBmpWasm } from "@/lib/bmp/bmp-wasm-client";
import { ensureGifWasm } from "@/lib/gif/gif-wasm-client";
import { ensureIcoWasm } from "@/lib/ico/ico-wasm-client";
import { ensureTiffWasm } from "@/lib/tiff/tiff-wasm-client";
import { importWasmGlue } from "@/lib/wasm/load-glue";

async function warmupCrate(crate: Parameters<typeof importWasmGlue>[0]): Promise<void> {
  const m = await importWasmGlue(crate);
  await m.default();
}

export async function warmupTransmutatorModule(module: TransmutationModule): Promise<void> {
  switch (module) {
    case "transmutador_jpg":
      return warmupCrate("transmutador_jpg");
    case "transmutador_png":
      return warmupCrate("transmutador_png");
    case "transmutador_webp":
      return warmupCrate("transmutador_webp");
    case "transmutador_encode":
      return warmupCrate("transmutador_encode");
    case "transmutador_gif":
      return ensureGifWasm().then(() => undefined);
    case "transmutador_bmp":
      return ensureBmpWasm().then(() => undefined);
    case "transmutador_tiff":
      return ensureTiffWasm().then(() => undefined);
    case "transmutador_ico":
      return ensureIcoWasm().then(() => undefined);
    default:
      throw new Error(`Unknown module: ${module}`);
  }
}
