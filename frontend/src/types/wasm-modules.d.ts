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
  export function estimate_png_to_jpg_size(
    input_bytes: Uint8Array,
    quality: number,
    bg_r: number,
    bg_g: number,
    bg_b: number,
    alpha_confidence: number,
    alpha_meaningful: number
  ): number;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_webp/transmutador_webp.js" {
  export function transmutar_webp_a_png(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_webp_a_png_with_compression(input_bytes: Uint8Array, compression: number): Uint8Array;
  export function estimate_webp_to_png_size(
    input_bytes: Uint8Array,
    compression: number,
    alpha_confidence: number,
    alpha_meaningful: number
  ): number;
  export function transmutar_webp_a_jpg(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_webp_a_jpg_with_options(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number): Uint8Array;
  export function estimate_webp_to_jpg_size(
    input_bytes: Uint8Array,
    quality: number,
    bg_r: number,
    bg_g: number,
    bg_b: number,
    alpha_confidence: number,
    alpha_meaningful: number
  ): number;
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
    /** @deprecated Structural only — use `assess_page_alpha` for UI transparency. */
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
    page_index: number,
    alpha_confidence: number,
    alpha_meaningful: number
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
    page_index: number,
    alpha_confidence: number,
    alpha_meaningful: number
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
  export function estimate_bmp_to_png_size(
    input_bytes: Uint8Array,
    compression: number,
    alpha_confidence: number,
    alpha_meaningful: number
  ): number;
  export function transmutar_bmp_a_jpg(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_bmp_a_jpg_with_options(input_bytes: Uint8Array, quality: number, bg_r: number, bg_g: number, bg_b: number): Uint8Array;
  export function estimate_bmp_to_jpg_size(
    input_bytes: Uint8Array,
    quality: number,
    bg_r: number,
    bg_g: number,
    bg_b: number,
    alpha_confidence: number,
    alpha_meaningful: number
  ): number;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_avif_encode/transmutador_avif_encode.js" {
  export function transmutar_png_a_avif(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_png_a_avif_with_options(
    input_bytes: Uint8Array,
    quality: number,
    speed: number
  ): Uint8Array;
  export function transmutar_jpg_a_avif(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_jpg_a_avif_with_options(
    input_bytes: Uint8Array,
    quality: number,
    speed: number
  ): Uint8Array;
  export function estimate_png_to_avif_size(
    input_bytes: Uint8Array,
    quality: number,
    speed: number
  ): number;
  export function estimate_jpg_to_avif_size(
    input_bytes: Uint8Array,
    quality: number,
    speed: number
  ): number;
  export function set_session_input_limit(max_bytes: number): void;
  export function reset_session_input_limit(): void;
  export function set_risk_mode(enabled: boolean): void;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_avif/transmutador_avif.js" {
  export class AvifMeta {
    readonly width: number;
    readonly height: number;
    readonly bit_depth: number;
    readonly has_alpha_channel: boolean;
    readonly is_sequence: boolean;
    readonly frame_count: number;
    readonly lossless: boolean;
  }
  export class AvifSession {
    readonly frame_count: number;
    readonly width: number;
    readonly height: number;
    readonly is_animated: boolean;
    frame_rgba(frame_index: number): Uint8Array;
    free(): void;
  }
  export function inspect_avif_meta(input_bytes: Uint8Array): AvifMeta;
  export function open_avif_session(input_bytes: Uint8Array): AvifSession;
  export function open_avif_session_with_progress(
    input_bytes: Uint8Array,
    on_progress: (current: number, total: number) => void
  ): AvifSession;
  export function transmutar_avif_a_png(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_avif_a_png_with_compression(
    input_bytes: Uint8Array,
    compression: number,
    frame_index: number
  ): Uint8Array;
  export function decode_avif_preview_png(
    input_bytes: Uint8Array,
    frame_index: number
  ): Uint8Array;
  export function estimate_avif_to_png_size(
    input_bytes: Uint8Array,
    compression: number,
    frame_index: number,
    alpha_confidence: number,
    alpha_meaningful: number
  ): number;
  export function assess_alpha(input_bytes: Uint8Array): {
    has_alpha_channel: boolean;
    has_meaningful_alpha: boolean;
    confidence: number;
  };
  export function transmutar_avif_a_jpg(input_bytes: Uint8Array): Uint8Array;
  export function transmutar_avif_a_jpg_with_options(
    input_bytes: Uint8Array,
    quality: number,
    bg_r: number,
    bg_g: number,
    bg_b: number,
    frame_index: number
  ): Uint8Array;
  export function estimate_avif_to_jpg_size(
    input_bytes: Uint8Array,
    quality: number,
    bg_r: number,
    bg_g: number,
    bg_b: number,
    frame_index: number,
    alpha_confidence: number,
    alpha_meaningful: number
  ): number;
  export function set_session_input_limit(max_bytes: number): void;
  export function reset_session_input_limit(): void;
  export function set_risk_mode(enabled: boolean): void;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_tga/transmutador_tga.js" {
  export class TgaMeta {
    readonly width: number;
    readonly height: number;
    readonly pixel_depth: number;
    readonly is_rle: boolean;
    readonly is_color_mapped: boolean;
    readonly has_alpha_channel: boolean;
    readonly is_rgb555: boolean;
    readonly orientation: string;
  }
  export function inspect_tga_meta(input_bytes: Uint8Array): TgaMeta;
  export function transmutar_tga_a_png(input_bytes: Uint8Array, compression: number): Uint8Array;
  export function transmutar_tga_a_png_with_compression(
    input_bytes: Uint8Array,
    compression: number
  ): Uint8Array;
  export function render_tga_preview_png(input_bytes: Uint8Array): Uint8Array;
  export function estimate_tga_to_png_size(input_bytes: Uint8Array, compression: number): number;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_optimize/transmutador_optimize.js" {
  export function recompress_png(input_bytes: Uint8Array, compression: number): Uint8Array;
  export function recompress_png_optimized(input_bytes: Uint8Array, compression: number, opt_level: number): Uint8Array;
  export function recompress_jpeg(input_bytes: Uint8Array, quality: number): Uint8Array;
  export function recompress_jpeg_with_options(input_bytes: Uint8Array, quality: number, chroma_code: number): Uint8Array;
  export function resize_png(input_bytes: Uint8Array, resize_percent: number): Uint8Array;
  export function resize_jpeg(input_bytes: Uint8Array, resize_percent: number): Uint8Array;
  export function estimate_png_recompress_size(input_bytes: Uint8Array, compression: number): number;
  export function estimate_png_recompress_optimized(input_bytes: Uint8Array, compression: number, opt_level: number): number;
  export function estimate_jpeg_recompress_size(input_bytes: Uint8Array, quality: number): number;
  export function estimate_jpeg_recompress_with_options(input_bytes: Uint8Array, quality: number, chroma_code: number): number;
  export function recompress_png_lossy(input_bytes: Uint8Array, colors: number, dither: boolean): Uint8Array;
  export function estimate_png_recompress_lossy(input_bytes: Uint8Array, colors: number, dither: boolean): number;
  export function set_session_input_limit(max_bytes: number): void;
  export function reset_session_input_limit(): void;
  export function set_risk_mode(enabled: boolean): void;
  export default function init(): Promise<void>;
}

declare module "*/transmutador_svg/transmutador_svg.js" {
  export class SvgMetaJs {
    readonly intrinsic_width: number;
    readonly intrinsic_height: number;
    readonly has_view_box: boolean;
    readonly has_text: boolean;
    readonly has_filters: boolean;
    readonly has_external_refs: boolean;
    readonly embedded_raster_count: number;
  }
  export function inspect_svg_meta(input_bytes: Uint8Array): SvgMetaJs;
  export function transmutar_svg_a_png(
    input_bytes: Uint8Array,
    out_w: number,
    out_h: number,
    compression: number
  ): Uint8Array;
  export function estimate_svg_to_png_size(
    input_bytes: Uint8Array,
    out_w: number,
    out_h: number,
    compression: number
  ): number;
  export function transmutar_svg_a_jpg_with_options(
    input_bytes: Uint8Array,
    out_w: number,
    out_h: number,
    quality: number,
    bg_r: number,
    bg_g: number,
    bg_b: number
  ): Uint8Array;
  export function estimate_svg_to_jpg_size(
    input_bytes: Uint8Array,
    out_w: number,
    out_h: number,
    quality: number,
    bg_r: number,
    bg_g: number,
    bg_b: number
  ): number;
  export function assess_svg_meaningful_alpha(input_bytes: Uint8Array): boolean;
  export function set_session_input_limit(max_bytes: number): void;
  export function reset_session_input_limit(): void;
  export function set_risk_mode(enabled: boolean): void;
  export default function init(): Promise<void>;
}
