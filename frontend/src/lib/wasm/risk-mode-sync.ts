import { importWasmGlue, type WasmCrate, type WasmGlueModule } from "@/lib/wasm/load-glue";
import type { TransmutationModule } from "@/workers/types";

type RiskModeFn = (enabled: boolean) => void;

function pickRiskMode(mod: WasmGlueModule): RiskModeFn | null {
  const fn = mod.set_risk_mode;
  return typeof fn === "function" ? (fn as RiskModeFn) : null;
}

/** Sync Risk mode flag on a Wasm module instance (main thread — prepare / alpha assess). */
export async function syncWasmRiskMode(
  moduleId: TransmutationModule | WasmCrate,
  enabled: boolean
): Promise<void> {
  const module = await importWasmGlue(moduleId as WasmCrate);  await module.default();
  pickRiskMode(module)?.(enabled);
}
