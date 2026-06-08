import type { TransmutationModule } from "@/workers/types";
import { ensureBmpWasm } from "@/lib/bmp/bmp-wasm-client";
import { ensureGifWasm } from "@/lib/gif/gif-wasm-client";

async function warmupJpg(): Promise<void> {
  const m = await import(/* webpackIgnore: true */ "/wasm/transmutador_jpg/transmutador_jpg.js");
  await m.default();
}

async function warmupPng(): Promise<void> {
  const m = await import(/* webpackIgnore: true */ "/wasm/transmutador_png/transmutador_png.js");
  await m.default();
}

async function warmupWebp(): Promise<void> {
  const m = await import(/* webpackIgnore: true */ "/wasm/transmutador_webp/transmutador_webp.js");
  await m.default();
}

async function warmupEncode(): Promise<void> {
  const m = await import(/* webpackIgnore: true */ "/wasm/transmutador_encode/transmutador_encode.js");
  await m.default();
}

export async function warmupTransmutatorModule(module: TransmutationModule): Promise<void> {
  switch (module) {
    case "transmutador_jpg":
      return warmupJpg();
    case "transmutador_png":
      return warmupPng();
    case "transmutador_webp":
      return warmupWebp();
    case "transmutador_encode":
      return warmupEncode();
    case "transmutador_gif":
      return ensureGifWasm().then(() => undefined);
    case "transmutador_bmp":
      return ensureBmpWasm().then(() => undefined);
    default:
      throw new Error(`Unknown module: ${module}`);
  }
}
