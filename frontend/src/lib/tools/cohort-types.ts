import type { ImageFormat, ToolDefinition } from "./types";

/** One input family group from a multi-file universal drop. */
export type InputCohort = {
  id: string;
  familyLabel: ImageFormat;
  files: File[];
  /** Tools valid for every file in this cohort (registry intersection). */
  commonTools: ToolDefinition[];
};

export type CohortBuildResult = {
  cohorts: InputCohort[];
  unsupported: File[];
};
