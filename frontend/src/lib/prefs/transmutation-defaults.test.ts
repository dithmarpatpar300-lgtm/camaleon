import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  resolveSpecDefault,
  REGISTRY_JPEG_QUALITY,
  REGISTRY_PNG_COMPRESSION,
  REGISTRY_AVIF_QUALITY,
  REGISTRY_AVIF_SPEED,
  writeTransmutationDefaults,
  resetTransmutationDefaults,
} from "./transmutation-defaults";
import { USER_SETTINGS_STORAGE_KEY } from "./user-settings";
import { getToolBySlug } from "@/lib/tools/tool-registry";

const store: Record<string, string> = {};

function mockLocalStorage() {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
  });
}

describe("transmutation defaults", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    mockLocalStorage();
    localStorage.removeItem(USER_SETTINGS_STORAGE_KEY);
    resetTransmutationDefaults();
  });

  it("uses registry JPEG quality for png-to-jpg when unset", () => {
    const tool = getToolBySlug("png-to-jpg")!;
    const spec = tool.optionSpecs!.find((s) => s.key === "quality")!;
    expect(resolveSpecDefault(tool, spec)).toBe(REGISTRY_JPEG_QUALITY);
  });

  it("uses stored JPEG quality override", () => {
    writeTransmutationDefaults({ jpegQuality: 72 });
    const tool = getToolBySlug("png-to-jpg")!;
    const spec = tool.optionSpecs!.find((s) => s.key === "quality")!;
    expect(resolveSpecDefault(tool, spec)).toBe(72);
  });

  it("uses registry PNG compression for jpg-to-png when unset", () => {
    const tool = getToolBySlug("jpg-to-png")!;
    const spec = tool.optionSpecs!.find((s) => s.key === "compression")!;
    expect(resolveSpecDefault(tool, spec)).toBe(REGISTRY_PNG_COMPRESSION);
  });

  it("uses AVIF quality for png-to-avif and speed separately", () => {
    writeTransmutationDefaults({ avifQuality: 55, avifSpeed: 8 });
    const tool = getToolBySlug("png-to-avif")!;
    const quality = tool.optionSpecs!.find((s) => s.key === "quality")!;
    const speed = tool.optionSpecs!.find((s) => s.key === "speed")!;
    expect(resolveSpecDefault(tool, quality!)).toBe(55);
    expect(resolveSpecDefault(tool, speed!)).toBe(8);
    expect(REGISTRY_AVIF_QUALITY).toBe(60);
    expect(REGISTRY_AVIF_SPEED).toBe(6);
  });

  it("uses global alpha background for flatten routes", () => {
    writeTransmutationDefaults({ alphaBackground: { r: 0, g: 0, b: 0 } });
    const tool = getToolBySlug("webp-to-jpg")!;
    const spec = tool.optionSpecs!.find((s) => s.key === "background")!;
    expect(resolveSpecDefault(tool, spec)).toEqual({ r: 0, g: 0, b: 0 });
  });
});
