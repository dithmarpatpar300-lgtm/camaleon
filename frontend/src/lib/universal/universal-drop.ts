import { capBatchFiles } from "@/lib/batch/batch-limits";
import { buildCohorts, toolsForCohortOutput, type InputCohort } from "@/lib/tools/universal-matrix";

export type UniversalDropResolution =
  | { kind: "empty" }
  | { kind: "unsupported"; names: string[] }
  | { kind: "mixed_cohorts"; cohorts: InputCohort[]; unsupported: File[]; capped: boolean }
  | { kind: "single"; cohort: InputCohort; unsupported: File[]; capped: boolean }
  | { kind: "batch"; cohort: InputCohort; unsupported: File[]; capped: boolean };

/**
 * Resolve a universal transmutator file drop.
 * Mixed-format multi-cohort drops return full cohorts for UniversalCohortPicker (Slice C).
 */
export function resolveUniversalDrop(
  files: File[],
  deviceMemoryGb?: number,
  options?: { allowMultiDrop?: boolean }
): UniversalDropResolution {
  if (files.length === 0) return { kind: "empty" };

  const allowMultiDrop = options?.allowMultiDrop ?? true;
  const workingFiles = allowMultiDrop ? files : files.slice(0, 1);

  const cappedList = capBatchFiles(workingFiles, deviceMemoryGb);
  const capped = cappedList.length < workingFiles.length;
  const { cohorts, unsupported } = buildCohorts(cappedList);

  if (cohorts.length === 0) {
    return {
      kind: "unsupported",
      names: unsupported.map((f) => f.name),
    };
  }

  if (cohorts.length > 1) {
    return { kind: "mixed_cohorts", cohorts, unsupported, capped };
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
