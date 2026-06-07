"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TransmutationModule, TransmutationOptions, WorkerResponse, WorkerPurpose } from "@/workers/types";

type TransmutateFn = (
  module: TransmutationModule,
  bytes: ArrayBuffer,
  options?: TransmutationOptions
) => Promise<WorkerResponse>;

type EstimateFn = (
  module: TransmutationModule,
  bytes: ArrayBuffer,
  options?: TransmutationOptions
) => Promise<number>;

export function useTransmutationWorker(): {
  transmutate: TransmutateFn;
  estimate: EstimateFn;
  ready: boolean;
} {
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
    (module: TransmutationModule, bytes: ArrayBuffer, options?: TransmutationOptions, purpose?: WorkerPurpose): Promise<WorkerResponse> => {
      return new Promise((resolve, reject) => {
        const worker = workerRef.current;
        if (!worker) {
          reject(new Error("Worker not initialized"));
          return;
        }
        const id = crypto.randomUUID();
        pendingRef.current.set(id, { resolve, reject });
        worker.postMessage({ id, module, bytes, options, purpose }, [bytes]);
      });
    },
    []
  );

  const transmutate = useCallback<TransmutateFn>(
    (module, bytes, options) => sendMessage(module, bytes, options, "transmute"),
    [sendMessage]
  );

  const estimate = useCallback<EstimateFn>(
    async (module, bytes, options) => {
      const response = await sendMessage(module, bytes, options, "estimate");
      if (!response.ok) throw new Error(response.error);
      return response.outputSize;
    },
    [sendMessage]
  );

  return { transmutate, estimate, ready };
}
