import { describe, expect, it } from "vitest";
import { resolveSvgOutputDimensions } from "./svg-output-dimensions";

describe("resolveSvgOutputDimensions", () => {
  it("100% keeps intrinsic size", () => {
    expect(resolveSvgOutputDimensions(32, 16, 100)).toEqual({ width: 32, height: 16 });
  });

  it("200% doubles dimensions", () => {
    expect(resolveSvgOutputDimensions(32, 16, 200)).toEqual({ width: 64, height: 32 });
  });

  it("512px scales longest edge", () => {
    expect(resolveSvgOutputDimensions(32, 16, 512)).toEqual({ width: 512, height: 256 });
  });

  it("512px on square icon", () => {
    expect(resolveSvgOutputDimensions(32, 32, 512)).toEqual({ width: 512, height: 512 });
  });
});
