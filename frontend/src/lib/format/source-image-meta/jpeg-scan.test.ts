import { describe, expect, it } from "vitest";
import { JPEG_METADATA_SCAN_LIMIT, scanJpegDimensions } from "./jpeg-scan";
import { probeJpegSourceMeta } from "./probes";

function makeMinimalJpeg(width: number, height: number): Uint8Array {
  const parts: number[] = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, ...Array.from("JFIF\0").map((c) => c.charCodeAt(0)), 1, 2, 0, 0, 1, 0, 1, 0, 0];
  parts.push(0xff, 0xdb, 0x00, 0x43, 0x00, ...Array(64).fill(1));
  parts.push(0xff, 0xc0, 0x00, 0x11, 0x08);
  parts.push((height >> 8) & 0xff, height & 0xff, (width >> 8) & 0xff, width & 0xff);
  parts.push(0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01);
  return new Uint8Array(parts);
}

/** Inserts a max-size APP1 segment after SOI so SOF lands past the old 64 KiB scan window. */
function makeJpegWithLargeAppPrefix(width: number, height: number): Uint8Array {
  const base = makeMinimalJpeg(width, height);
  const appPayloadLen = 65533;
  const appSegment = new Uint8Array(4 + appPayloadLen);
  appSegment[0] = 0xff;
  appSegment[1] = 0xe1;
  appSegment[2] = 0xff;
  appSegment[3] = 0xff;
  appSegment.set(Array.from("Exif\0\0").map((c) => c.charCodeAt(0)), 4);

  const prefix = new Uint8Array(2 + appSegment.length + base.length - 2);
  prefix[0] = 0xff;
  prefix[1] = 0xd8;
  prefix.set(appSegment, 2);
  prefix.set(base.subarray(2), 2 + appSegment.length);
  return prefix;
}

describe("scanJpegDimensions", () => {
  it("reads dimensions from a minimal JPEG", () => {
    const jpg = makeMinimalJpeg(460, 575);
    expect(scanJpegDimensions(jpg)).toEqual({ width: 460, height: 575 });
  });

  it("finds SOF after a large APP1 segment beyond the old 64 KiB limit", () => {
    const jpg = makeJpegWithLargeAppPrefix(4000, 3000);
    expect(jpg.length).toBeGreaterThan(65_536);
    expect(scanJpegDimensions(jpg)).toEqual({ width: 4000, height: 3000 });
  });

  it("respects the metadata scan cap", () => {
    const overflow = JPEG_METADATA_SCAN_LIMIT + 20_000;
    const jpg = new Uint8Array(overflow + 200);
    jpg[0] = 0xff;
    jpg[1] = 0xd8;
    jpg[2] = 0xff;
    jpg[3] = 0xe1;
    jpg[4] = ((overflow + 2) >> 8) & 0xff;
    jpg[5] = (overflow + 2) & 0xff;
    expect(scanJpegDimensions(jpg)).toBeNull();
  });
});

describe("probeJpegSourceMeta", () => {
  it("returns bit depth label for valid JPEG", () => {
    const bytes = makeMinimalJpeg(240, 135);
    const meta = probeJpegSourceMeta(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    );
    expect(meta).toEqual({ width: 240, height: 135, bitDepthLabel: "24-bit" });
  });
});
