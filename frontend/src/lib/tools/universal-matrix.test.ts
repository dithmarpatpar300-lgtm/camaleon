import { describe, expect, it } from "vitest";
import {
  getAllSupportedInputExtensions,
  getToolsForFileName,
  resolveInputFormatLabel,
  sortToolsForOutputPicker,
} from "./universal-matrix";

describe("universal-matrix", () => {
  it("lists unique supported extensions", () => {
    const exts = getAllSupportedInputExtensions();
    expect(exts).toContain(".png");
    expect(exts).not.toContain(".heic");
    expect(new Set(exts).size).toBe(exts.length);
  });

  it("returns PNG outbound tools for a PNG file", () => {
    const tools = getToolsForFileName("photo.png");
    const outputs = tools.map((t) => t.slug).sort();
    expect(outputs).toEqual(
      ["png-to-avif", "png-to-ico", "png-to-jpg", "png-to-webp"].sort()
    );
  });

  it("returns only PNG for ICO input", () => {
    const tools = getToolsForFileName("favicon.ico");
    expect(tools).toHaveLength(1);
    expect(tools[0].slug).toBe("ico-to-png");
  });

  it("returns empty for unsupported extension", () => {
    expect(getToolsForFileName("photo.heic")).toEqual([]);
  });

  it("resolveInputFormatLabel returns format from registry", () => {
    expect(resolveInputFormatLabel("x.webp")).toBe("WEBP");
  });

  it("sortToolsForOutputPicker orders by output format", () => {
    const tools = getToolsForFileName("photo.png");
    const sorted = sortToolsForOutputPicker(tools).map((t) => t.toFormat);
    const pngIdx = sorted.indexOf("PNG");
    const jpgIdx = sorted.indexOf("JPG");
    expect(pngIdx).toBe(-1);
    expect(jpgIdx).toBeGreaterThan(-1);
  });
});
