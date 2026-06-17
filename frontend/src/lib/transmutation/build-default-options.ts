import type { ToolDefinition } from "@/lib/tools/types";
import type { RgbColor } from "@/lib/tools/types";
import type { TransmutationOptions } from "@/workers/types";
import { resolveSpecDefault } from "@/lib/prefs/transmutation-defaults";

export function buildDefaultOptions(
  specs: ToolDefinition["optionSpecs"],
  tool: ToolDefinition
): TransmutationOptions {
  const opts: TransmutationOptions = {};
  if (!specs) return opts;
  for (const spec of specs) {
    const resolved = resolveSpecDefault(tool, spec);
    if (spec.key === "background") {
      opts.background = resolved as RgbColor;
    } else {
      opts[spec.key] = resolved as number;
    }
  }
  return opts;
}
