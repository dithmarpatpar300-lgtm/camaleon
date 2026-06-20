import { describe, expect, it } from "vitest";
import { getActiveTools } from "@/lib/tools/tool-registry";
import type { TransmutationModule } from "@/workers/types";
import { WARMUP_SUPPORTED_MODULES } from "./warmup-wasm";

describe("warmupTransmutatorModule coverage", () => {
  it("warms up every Wasm module referenced by active tools", () => {
    const registryModules = new Set(
      getActiveTools().map((tool) => tool.module)
    );
    const supported = new Set<string>(WARMUP_SUPPORTED_MODULES);

    const missing: TransmutationModule[] = [];
    for (const module of registryModules) {
      if (!supported.has(module)) {
        missing.push(module);
      }
    }

    expect(missing, `Add warmup case for: ${missing.join(", ")}`).toEqual([]);
  });

  it("lists only known TransmutationModule ids (no drift)", () => {
    const known = new Set(
      getActiveTools().map((tool) => tool.module)
    );
    const orphan = WARMUP_SUPPORTED_MODULES.filter((m) => !known.has(m));
    expect(orphan).toEqual([]);
  });
});
