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
import {
  TOAST_DURATION_MS,
  TOAST_EXIT_MS,
  type ToastInput,
  type ToastRecord,
} from "@/lib/toast";
import { bumpFloatingNoticesLayer, demoteFloatingNoticesLayer } from "@/lib/layout/floating-notices-layer";

type ToastFn = (opts: ToastInput) => void;

type ToastContextValue = {
  toast: ToastFn;
};

type ToastStackContextValue = {
  items: ToastRecord[];
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const ToastStackContext = createContext<ToastStackContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const exitTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const clearAutoDismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const removeToast = useCallback((id: number) => {
    clearAutoDismiss(id);
    const exitTimer = exitTimersRef.current.get(id);
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimersRef.current.delete(id);
    }
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length === 0) {
        demoteFloatingNoticesLayer();
      }
      return next;
    });
  }, [clearAutoDismiss]);

  const dismissToast = useCallback(
    (id: number) => {
      clearAutoDismiss(id);

      setItems((prev) => {
        const target = prev.find((item) => item.id === id);
        if (!target || target.exiting) return prev;
        return prev.map((item) => (item.id === id ? { ...item, exiting: true } : item));
      });

      const exitTimer = setTimeout(() => {
        removeToast(id);
      }, TOAST_EXIT_MS);
      exitTimersRef.current.set(id, exitTimer);
    },
    [clearAutoDismiss, removeToast]
  );

  const toast = useCallback<ToastFn>(
    ({ message, variant = "info" }) => {
      const id = ++toastId;
      const nextItem: ToastRecord = {
        id,
        message,
        variant: variant === "info" ? "info" : "success",
        exiting: false,
      };

      setItems((prev) => [...prev, nextItem]);
      bumpFloatingNoticesLayer();

      const timer = setTimeout(() => {
        dismissToast(id);
      }, TOAST_DURATION_MS);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    const exitTimers = exitTimersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      for (const timer of exitTimers.values()) clearTimeout(timer);
      timers.clear();
      exitTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastStackContext.Provider value={{ items, dismissToast }}>
        {children}
      </ToastStackContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

export function useToastStack(): ToastStackContextValue {
  const ctx = useContext(ToastStackContext);
  if (!ctx) {
    throw new Error("useToastStack must be used within a <ToastProvider>");
  }
  return ctx;
}
