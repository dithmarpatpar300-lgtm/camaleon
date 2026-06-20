import { describe, expect, it } from "vitest";
import {
  bumpFloatingNoticesLayer,
  holdFloatingNoticesForModal,
  registerFloatingNoticesLayer,
  releaseFloatingNoticesToastLayer,
  resetFloatingNoticesLayerForTests,
} from "./floating-notices-layer";

describe("floating-notices-layer", () => {
  it("tracks modal and toast holds independently", () => {
    resetFloatingNoticesLayerForTests();

    const promoted: string[] = [];
    const demoted: string[] = [];

    const unregister = registerFloatingNoticesLayer({
      promote: () => promoted.push("p"),
      demote: () => demoted.push("d"),
    });

    const releaseModal = holdFloatingNoticesForModal();
    expect(promoted).toEqual([]);
    expect(demoted).toEqual(["d"]);

    bumpFloatingNoticesLayer();
    expect(promoted).toEqual([]);
    expect(demoted).toEqual(["d"]);

    releaseFloatingNoticesToastLayer();
    releaseModal();
    expect(demoted).toEqual(["d", "d"]);

    unregister();
  });
});
