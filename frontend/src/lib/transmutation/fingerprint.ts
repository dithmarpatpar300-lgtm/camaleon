import type { TransmutationModule, TransmutationOptions } from "@/workers/types";
import { buildFingerprint } from "@/workers/result-cache";

export function buildFileIdentity(file: File): string {
  return `${file.size}:${file.lastModified}:${file.name}`;
}

export function buildTransmuteFingerprint(
  module: TransmutationModule,
  file: File,
  options: TransmutationOptions
): string {
  return buildFingerprint(module, buildFileIdentity(file), options);
}
