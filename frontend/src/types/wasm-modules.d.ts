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
  export function transmutar_jpg_a_webp(input_bytes: Uint8Array): Uint8Array;
  export function estimate_jpg_to_webp_size(input_bytes: Uint8Array): number;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_gif/transmutador_gif.js" {
  export class GifMeta {
    readonly frame_count: number;
    readonly width: number;
    readonly height: number;
    readonly is_animated: boolean;
  }
  export class GifSession {
    readonly frame_count: number;
    readonly width: number;
    readonly height: number;
    readonly is_animated: boolean;
    frame_rgba(frame_index: number): Uint8Array;
    free(): void;
  }
  export function inspect_gif_meta(input_bytes: Uint8Array): GifMeta;
  export function open_gif_session(input_bytes: Uint8Array): GifSession;
  export function open_gif_session_with_progress(
    input_bytes: Uint8Array,
    on_progress: (current: number, total: number) => void
  ): GifSession;
  export function render_gif_frame_preview_png(input_bytes: Uint8Array, frame_index: number): Uint8Array;
  export function transmutar_gif_a_png(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_gif_a_png_with_compression(input_bytes: Uint8Array, compression: number, frame_index: number): Uint8Array;
  export function estimate_gif_to_png_size(input_bytes: Uint8Array, compression: number, frame_index: number): number;
  export function transmutar_gif_a_jpg(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_gif_a_jpg_with_options(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number, frame_index: number): Uint8Array;
  export function estimate_gif_to_jpg_size(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number, frame_index: number): number;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_tiff/transmutador_tiff.js" {
  export class TiffMeta {
    readonly page_count: number;
    page_width(page_index: number): number;
    page_height(page_index: number): number;
    page_bit_depth(page_index: number): number;
    page_has_alpha(page_index: number): boolean;
    page_photometric(page_index: number): number;
  }
  export function inspect_tiff_meta(input_bytes: Uint8Array): TiffMeta;
  export function render_tiff_page_preview_png(input_bytes: Uint8Array, page_index: number): Uint8Array;
  export function transmutar_tiff_a_png(input_bytes: Uint8Array, page_index: number): Uint8Array;
  export function transmutar_tiff_a_png_with_compression(
    input_bytes: Uint8Array,
    compression: number,
    page_index: number
  ): Uint8Array;
  export function estimate_tiff_to_png_size(
    input_bytes: Uint8Array,
    compression: number,
    page_index: number
  ): number;
  export function transmutar_tiff_a_jpg(input_bytes: Uint8Array, page_index: number): Uint8Array;
  export function transmutar_tiff_a_jpg_with_options(
    input_bytes: Uint8Array,
    quality: number,
    bg_r: number,
    bg_g: number,
    bg_b: number,
    page_index: number
  ): Uint8Array;
  export function estimate_tiff_to_jpg_size(
    input_bytes: Uint8Array,
    quality: number,
    bg_r: number,
    bg_g: number,
    bg_b: number,
    page_index: number
  ): number;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_ico/transmutador_ico.js" {
  export class IcoMeta {
    readonly entry_count: number;
    readonly default_entry_index: number;
    readonly is_cursor: boolean;
    entry_width(entry_index: number): number;
    entry_height(entry_index: number): number;
    entry_bits_per_pixel(entry_index: number): number;
    entry_is_png(entry_index: number): boolean;
    entry_has_alpha(entry_index: number): boolean;
  }
  export function inspect_ico_meta(input_bytes: Uint8Array): IcoMeta;
  export function transmutar_ico_a_png(input_bytes: Uint8Array, entry_index: number): Uint8Array;
  export function transmutar_ico_a_png_with_compression(
    input_bytes: Uint8Array,
    compression: number,
    entry_index: number
  ): Uint8Array;
  export function render_ico_entry_preview_png(input_bytes: Uint8Array, entry_index: number): Uint8Array;
  export function estimate_ico_to_png_size(
    input_bytes: Uint8Array,
    compression: number,
    entry_index: number
  ): number;
  export function transmutar_png_a_ico(input_bytes: Uint8Array, target_size: number): Uint8Array;
  export function estimate_png_to_ico_size(input_bytes: Uint8Array, target_size: number): number;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_bmp/transmutador_bmp.js" {
  export class BmpMeta {
    readonly width: number;
    readonly height: number;
    readonly bit_count: number;
    readonly compression: number;
    readonly has_meaningful_alpha: boolean;
  }
  export function inspect_bmp_meta(input_bytes: Uint8Array): BmpMeta;
  export function transmutar_bmp_a_png(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_bmp_a_png_with_compression(input_bytes: Uint8Array, compression: number): Uint8Array;
  export function estimate_bmp_to_png_size(input_bytes: Uint8Array, compression: number): number;
  export function transmutar_bmp_a_jpg(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_bmp_a_jpg_with_options(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number): Uint8Array;
  export function estimate_bmp_to_jpg_size(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number): number;
  export default function init(): Promise<void>;
}
