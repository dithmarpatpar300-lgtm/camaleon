declare module "*/transmutador_jpg/transmutador_jpg.js" {
  export function transmutar_jpg_a_png(input_bytes: Uint8Array): Uint8Array;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_png/transmutador_png.js" {
  export function transmutar_png_a_jpg(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_png_a_jpg_with_quality(input_bytes: Uint8Array, quality: number): Uint8Array;
  export default function init(): Promise<void>;
}
