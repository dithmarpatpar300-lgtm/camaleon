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
import type {
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
  outputExtension?: OutputExtension
) => Promise<WorkerResponse>;

type EstimateFn = (
  module: TransmutationModule,
  bytes: ArrayBuffer,
  options?: TransmutationOptions,
  meta?: WorkerRequestMeta,
  outputExtension?: OutputExtension
) => Promise<EstimateResult>;

type WorkerContextValue = {
  ready: boolean;
  transmutate: TransmutateFn;
  estimate: EstimateFn;
};

const WorkerContext = createContext<WorkerContextValue | null>(null);

export function TransmutationWorkerProvider({ children }: { children: ReactNode }) {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const pendingRef = useRef<
    Map<string, { resolve: (r: WorkerResponse) => void; reject: (e: Error) => void }>
  >(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const worker = new Worker(
      new URL("../workers/transmutation.worker.ts", import.meta.url),
      { type: "module" }
    );

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

    workerRef.current = worker;
    setReady(true);

    return () => {
      worker.terminate();
      workerRef.current = null;
      setReady(false);
      pendingRef.current.clear();
    };
  }, []);

  const sendMessage = useCallback(
    (
      module: TransmutationModule,
      bytes: ArrayBuffer,
      options?: TransmutationOptions,
      purpose?: WorkerPurpose,
      meta?: WorkerRequestMeta,
      outputExtension?: OutputExtension
    ): Promise<WorkerResponse> => {
      return new Promise((resolve, reject) => {
        const worker = workerRef.current;
        if (!worker) {
          reject(new Error("Worker not initialized"));
          return;
        }
        const id = crypto.randomUUID();
        pendingRef.current.set(id, { resolve, reject });
        worker.postMessage(
          {
            id,
            module,
            bytes,
            options,
            outputExtension,
            purpose,
            fingerprint: meta?.fingerprint,
            fileIdentity: meta?.fileIdentity,
            enableResultCache: meta?.enableResultCache,
            cacheMaxOutputBytes: meta?.cacheMaxOutputBytes,
          },
          [bytes]
        );
      });
    },
    []
  );

  const transmutate = useCallback<TransmutateFn>(
    (module, bytes, options, meta, outputExtension) =>
      sendMessage(module, bytes, options, "transmute", meta, outputExtension),
    [sendMessage]
  );

  const estimate = useCallback<EstimateFn>(
    async (module, bytes, options, meta, outputExtension) => {
      const response = await sendMessage(module, bytes, options, "estimate", meta, outputExtension);
      if (response.ok) {
        return {
          outputSize: response.outputSize,
          cacheStored: response.cacheStored,
        };
      }
      if (response.error === "superseded") {
        throw new Error("superseded");
      }
      throw new Error(response.error);
    },
    [sendMessage]
  );

  return (
    <WorkerContext.Provider value={{ ready, transmutate, estimate }}>
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
