export type WasmManifestCrate = {
  jsSize: number;
  wasmSize: number;
};

export type WasmManifest = {
  version: string;
  buildId: string;
  generatedAt: string;
  totalWasmSize: number;
  crates: Record<string, WasmManifestCrate>;
};
