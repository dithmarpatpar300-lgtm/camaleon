import {
  assertWithinPixelLimit,
  computeTargetDimensions,
} from "./dimensions";

export type DownscaleProgress = (progress: number) => void;

export type DownscaleResult = {
  bytes: ArrayBuffer;
  width: number;
  height: number;
  mimeType: string;
};

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Downscale raster image bytes via createImageBitmap + canvas.
 * Output is PNG for lossless handoff to Wasm transmutators.
 */
export async function downscaleImageBytes(
  inputBytes: ArrayBuffer,
  mimeType: string,
  maxEdge: number,
  onProgress?: DownscaleProgress
): Promise<DownscaleResult> {
  if (typeof document === "undefined") {
    throw new Error("Downscale requires a browser environment");
  }

  onProgress?.(0.05);
  await yieldToMain();

  const blob = new Blob([inputBytes], { type: mimeType || "application/octet-stream" });
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error("Could not decode image for resize — format may be unsupported");
  }

  onProgress?.(0.25);

  const target = computeTargetDimensions(bitmap.width, bitmap.height, maxEdge);
  assertWithinPixelLimit(target.width, target.height);

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas 2D context unavailable");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, target.width, target.height);
  bitmap.close();

  onProgress?.(0.55);
  await yieldToMain();

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))),
      "image/png"
    );
  });

  onProgress?.(0.85);
  const bytes = await outBlob.arrayBuffer();
  onProgress?.(1);

  return {
    bytes,
    width: target.width,
    height: target.height,
    mimeType: "image/png",
  };
}
