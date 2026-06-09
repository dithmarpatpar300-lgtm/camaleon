import Image from "next/image";
import { cn } from "@/lib/utils";

/** Raster mark extracted from Lamina 3 option C — avoids lossy hand-traced SVG paths. */
export const CAMALEON_MARK_SRC = "/brand/camaleon-mark.png";
export const CAMALEON_MARK_SIZE = 128;

export const BRAND_GREEN = "#22C55E";
export const BRAND_BG_DARK = "#0E0F11";
export const BRAND_BG_LIGHT = "#F8FAF9";

type CamaleonMarkProps = {
  className?: string;
  /** Outer square frame (Tailwind size). Mark scales inside with object-contain. */
  frameClassName?: string;
};

export function CamaleonMark({ className, frameClassName = "h-8 w-8" }: CamaleonMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        frameClassName,
        className
      )}
      aria-hidden
    >
      <Image
        src={CAMALEON_MARK_SRC}
        alt=""
        width={CAMALEON_MARK_SIZE}
        height={CAMALEON_MARK_SIZE}
        className="h-[94%] w-[94%] object-contain"
        priority
      />
    </span>
  );
}
