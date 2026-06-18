import { capBatchFiles } from "@/lib/batch/batch-limits";
import { buildCohorts, toolsForCohortOutput, type InputCohort } from "@/lib/tools/universal-matrix";

export type UniversalDropResolution =
  | { kind: "empty" }
  | { kind: "unsupported"; names: string[] }
  | { kind: "mixed_cohorts"; cohortCount: number }
  | { kind: "single"; cohort: InputCohort; unsupported: File[]; capped: boolean }
  | { kind: "batch"; cohort: InputCohort; unsupported: File[]; capped: boolean };

/**
 * Resolve a universal transmutator file drop for Tier 3.6.1 Slice B (homogeneous batch).
 * Mixed-format multi-cohort drops return `mixed_cohorts` — handled in Slice C.
 */
export function resolveUniversalDrop(
  files: File[],
  deviceMemoryGb?: number
): UniversalDropResolution {
  if (files.length === 0) return { kind: "empty" };

  const cappedList = capBatchFiles(files, deviceMemoryGb);
  const capped = cappedList.length < files.length;
  const { cohorts, unsupported } = buildCohorts(cappedList);

  if (cohorts.length === 0) {
    return {
      kind: "unsupported",
      names: unsupported.map((f) => f.name),
    };
  }

  if (cohorts.length > 1) {
    return { kind: "mixed_cohorts", cohortCount: cohorts.length };
  }

  const cohort = cohorts[0];
  if (cohort.files.length === 1) {
    return { kind: "single", cohort, unsupported, capped };
  }

  return { kind: "batch", cohort, unsupported, capped };
}

export function batchOutputToolsForCohort(cohort: InputCohort) {
  return toolsForCohortOutput(cohort, { batchOnly: true });
}
