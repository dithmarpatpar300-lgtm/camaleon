import type {
  EncodeSource,
  OutputExtension,
  TransmutationModule,
  TransmutationOptions,
} from "@/workers/types";
import { buildFingerprint } from "@/workers/result-cache";

export function buildFileIdentity(file: File, resizeMaxEdge?: number): string {
  const base = `${file.size}:${file.lastModified}:${file.name}`;
  return resizeMaxEdge != null ? `${base}:r${resizeMaxEdge}` : base;
}

export function buildTransmuteFingerprint(
  module: TransmutationModule,
  file: File,
  options: TransmutationOptions,
  outputExtension?: OutputExtension,
  encodeSource?: EncodeSource,
  resizeMaxEdge?: number
): string {
  return buildFingerprint(
    module,
    buildFileIdentity(file, resizeMaxEdge),
    options,
    outputExtension,
    encodeSource
  );
}
