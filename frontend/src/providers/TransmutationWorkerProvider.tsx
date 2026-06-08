"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TransmutationRouteLifecycle } from "@/components/transmute/TransmutationRouteLifecycle";
import type {
  EncodeSource,
  OutputExtension,
  TransmutationModule,
  TransmutationOptions,
  WorkerRequestMeta,
  WorkerResponse,
  WorkerPurpose,
} from "@/workers/types";

export type { WorkerRequestMeta };

export type EstimateResult = {
  outputSize: number;
  cacheStored?: boolean;
};

type TransmutateFn = (
  module: TransmutationModule,
  bytes: ArrayBuffer,
  options?: TransmutationOptions,
  meta?: WorkerRequestMeta,
  outputExtension?: OutputExtension,
  encodeSource?: EncodeSource
) => Promise<WorkerResponse>;

type EstimateFn = (
  module: TransmutationModule,
  bytes: ArrayBuffer,
  options?: TransmutationOptions,
  meta?: WorkerRequestMeta,
  outputExtension?: OutputExtension,
  encodeSource?: EncodeSource
) => Promise<EstimateResult>;

type WorkerContextValue = {
  ready: boolean;
  transmutate: TransmutateFn;
  estimate: EstimateFn;
};

const WorkerContext = createContext<WorkerContextValue | null>(null);

const WORKER_RECYCLED = "worker-recycled";

function attachWorker(
  worker: Worker,
  pendingRef: React.MutableRefObject<
    Map<string, { resolve: (r: WorkerResponse) => void; reject: (e: Error) => void }>
  >
): void {
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const response = e.data;
    const pending = pendingRef.current.get(response.id);
    if (pending) {
      pending.resolve(response);
      pendingRef.current.delete(response.id);
    }
  };

  worker.onerror = (e) => {
    console.error("Transmutation worker error:", e);
  };
}

export function TransmutationWorkerProvider({ children }: { children: ReactNode }) {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [workerEpoch, setWorkerEpoch] = useState(0);
  const pendingRef = useRef<
    Map<string, { resolve: (r: WorkerResponse) => void; reject: (e: Error) => void }>
  >(new Map());

  const rejectAllPending = useCallback((message: string) => {
    const err = new Error(message);
    for (const { reject } of pendingRef.current.values()) {
      reject(err);
    }
    pendingRef.current.clear();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const worker = new Worker(
      new URL("../workers/transmutation.worker.ts", import.meta.url),
      { type: "module" }
    );

    attachWorker(worker, pendingRef);
    workerRef.current = worker;
    setReady(true);

    return () => {
      rejectAllPending(WORKER_RECYCLED);
      worker.terminate();
      workerRef.current = null;
      setReady(false);
    };
  }, [workerEpoch, rejectAllPending]);

  const recycleWorker = useCallback(() => {
    rejectAllPending(WORKER_RECYCLED);
    setReady(false);
    setWorkerEpoch((epoch) => epoch + 1);
  }, [rejectAllPending]);

  const sendMessage = useCallback(
    (
      module: TransmutationModule,
      bytes: ArrayBuffer,
      options?: TransmutationOptions,
      purpose?: WorkerPurpose,
      meta?: WorkerRequestMeta,
      outputExtension?: OutputExtension,
      encodeSource?: EncodeSource
    ): Promise<WorkerResponse> => {
      return new Promise((resolve, reject) => {
        const worker = workerRef.current;
        if (!worker) {
          reject(new Error("Worker not initialized"));
          return;
        }
        const id = crypto.randomUUID();
        pendingRef.current.set(id, { resolve, reject });
        const transferBytes = bytes.slice(0);
        worker.postMessage(
          {
            id,
            module,
            bytes: transferBytes,
            options,
            outputExtension,
            encodeSource,
            purpose,
            fingerprint: meta?.fingerprint,
            fileIdentity: meta?.fileIdentity,
            enableResultCache: meta?.enableResultCache,
            cacheMaxOutputBytes: meta?.cacheMaxOutputBytes,
            effectiveMaxInputBytes: meta?.effectiveMaxInputBytes,
            userConsentedOversize: meta?.userConsentedOversize,
          },
          [transferBytes]
        );
      });
    },
    []
  );

  const transmutate = useCallback<TransmutateFn>(
    (module, bytes, options, meta, outputExtension, encodeSource) =>
      sendMessage(module, bytes, options, "transmute", meta, outputExtension, encodeSource),
    [sendMessage]
  );

  const estimate = useCallback<EstimateFn>(
    async (module, bytes, options, meta, outputExtension, encodeSource) => {
      const response = await sendMessage(
        module,
        bytes,
        options,
        "estimate",
        meta,
        outputExtension,
        encodeSource
      );
      if (response.ok) {
        return {
          outputSize: response.outputSize,
          cacheStored: response.cacheStored,
        };
      }
      if (response.error === "superseded" || response.error === WORKER_RECYCLED) {
        throw new Error("superseded");
      }
      throw new Error(response.error);
    },
    [sendMessage]
  );

  return (
    <WorkerContext.Provider value={{ ready, transmutate, estimate }}>
      <TransmutationRouteLifecycle recycleWorker={recycleWorker} />
      {children}
    </WorkerContext.Provider>
  );
}

export function useTransmutationWorker(): WorkerContextValue {
  const ctx = useContext(WorkerContext);
  if (!ctx) {
    throw new Error("useTransmutationWorker must be used within <TransmutationWorkerProvider>");
  }
  return ctx;
}
