import { describe, expect, it } from "vitest";
import { getToolBySlug } from "@/lib/tools/tool-registry";
import { resolveSourceImageMeta } from "./index";

function makeMinimalJpeg(width: number, height: number): ArrayBuffer {
  const parts: number[] = [
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x10,
    ...Array.from("JFIF\0").map((c) => c.charCodeAt(0)),
    1,
    2,
    0,
    0,
    1,
    0,
    1,
    0,
    0,
  ];
  parts.push(0xff, 0xdb, 0x00, 0x43, 0x00, ...Array(64).fill(1));
  parts.push(0xff, 0xc0, 0x00, 0x11, 0x08);
  parts.push((height >> 8) & 0xff, height & 0xff, (width >> 8) & 0xff, width & 0xff);
  parts.push(0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01);
  return new Uint8Array(parts).buffer;
}

describe("resolveSourceImageMeta format aliases", () => {
  it("resolves JPEG fromFormat for optimize tools (jpg-compress)", async () => {
    const tool = getToolBySlug("jpg-compress");
    expect(tool?.fromFormat).toBe("JPEG");

    const bytes = makeMinimalJpeg(800, 600);
    const meta = await resolveSourceImageMeta(tool!, bytes, { gifSession: null });

    expect(meta).toEqual({ width: 800, height: 600, bitDepthLabel: "24-bit" });
  });
});
