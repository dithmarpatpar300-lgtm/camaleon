import { fileMatchesExtensions } from "@/lib/tools/extensions";
import type { ToolDefinition } from "@/lib/tools/types";

export type ToolFilePartition = {
  accepted: File[];
  rejected: File[];
};

export function partitionFilesForTool(
  files: File[],
  tool: ToolDefinition
): ToolFilePartition {
  const accepted: File[] = [];
  const rejected: File[] = [];
  for (const file of files) {
    if (fileMatchesExtensions(file.name, tool.acceptExtensions)) {
      accepted.push(file);
    } else {
      rejected.push(file);
    }
  }
  return { accepted, rejected };
}
