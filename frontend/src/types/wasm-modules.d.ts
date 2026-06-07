declare module "*/transmutador_jpg/transmutador_jpg.js" {
  export function estimate_jpg_to_png_size(input_bytes: Uint8Array, compression: number): number;
  export function transmutar_jpg_a_png(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_jpg_a_png_with_compression(input_bytes: Uint8Array, compression: number): Uint8Array;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_png/transmutador_png.js" {
  export function transmutar_png_a_jpg(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_png_a_jpg_with_quality(input_bytes: Uint8Array, quality: number): Uint8Array;
  export function transmutar_png_a_jpg_with_options(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number): Uint8Array;
  export function estimate_png_to_jpg_size(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number): number;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_webp/transmutador_webp.js" {
  export function transmutar_webp_a_png(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_webp_a_png_with_compression(input_bytes: Uint8Array, compression: number): Uint8Array;
  export function estimate_webp_to_png_size(input_bytes: Uint8Array, compression: number): number;
  export function transmutar_webp_a_jpg(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_webp_a_jpg_with_options(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number): Uint8Array;
  export function estimate_webp_to_jpg_size(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number): number;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_encode/transmutador_encode.js" {
  export function transmutar_png_a_webp(input_bytes: Uint8Array): Uint8Array;
  export function estimate_png_to_webp_size(input_bytes: Uint8Array): number;
  export default function init(): Promise<void>;
}
