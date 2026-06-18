import { describe, expect, it } from "vitest";
import { isBatchEnabledTool } from "@/lib/batch/batch-tool-allowlist";
import {
  buildCohorts,
  getAllSupportedInputExtensions,
  getToolsForFileName,
  intersectToolsForFiles,
  resolveInputFormatLabel,
  sortToolsForOutputPicker,
  toolsForCohortOutput,
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

  it("buildCohorts groups 4 PNG + 1 SVG into two cohorts", () => {
    const files = [
      new File([], "a.png"),
      new File([], "b.png"),
      new File([], "c.png"),
      new File([], "d.png"),
      new File([], "icon.svg"),
    ];
    const { cohorts, unsupported } = buildCohorts(files);
    expect(unsupported).toEqual([]);
    expect(cohorts).toHaveLength(2);
    const png = cohorts.find((c) => c.familyLabel === "PNG");
    const svg = cohorts.find((c) => c.familyLabel === "SVG");
    expect(png?.files).toHaveLength(4);
    expect(svg?.files).toHaveLength(1);
    expect(png?.commonTools.some((t) => t.slug === "png-to-jpg")).toBe(true);
    expect(svg?.commonTools.some((t) => t.slug === "svg-to-png")).toBe(true);
  });

  it("buildCohorts surfaces unsupported extensions", () => {
    const files = [new File([], "photo.png"), new File([], "photo.heic")];
    const { cohorts, unsupported } = buildCohorts(files);
    expect(cohorts).toHaveLength(1);
    expect(cohorts[0].files).toHaveLength(1);
    expect(unsupported).toHaveLength(1);
    expect(unsupported[0].name).toBe("photo.heic");
  });

  it("buildCohorts merges jpg and jpeg into one JPEG family cohort", () => {
    const files = [new File([], "a.jpg"), new File([], "b.jpeg")];
    const { cohorts } = buildCohorts(files);
    expect(cohorts).toHaveLength(1);
    expect(cohorts[0].familyLabel).toBe("JPG");
    expect(cohorts[0].files).toHaveLength(2);
  });

  it("intersectToolsForFiles returns common PNG outputs", () => {
    const files = [new File([], "a.png"), new File([], "b.png")];
    const slugs = intersectToolsForFiles(files).map((t) => t.slug).sort();
    expect(slugs).toEqual(
      ["png-to-avif", "png-to-ico", "png-to-jpg", "png-to-webp"].sort()
    );
  });

  it("toolsForCohortOutput filters to batch slugs when batchOnly", () => {
    const files = [new File([], "a.png"), new File([], "b.png")];
    const { cohorts } = buildCohorts(files);
    const batchTools = toolsForCohortOutput(cohorts[0], { batchOnly: true });
    expect(batchTools.length).toBeGreaterThan(0);
    expect(batchTools.every((t) => isBatchEnabledTool(t.slug))).toBe(true);
    expect(batchTools.some((t) => t.slug === "png-to-gif")).toBe(false);
  });
});
