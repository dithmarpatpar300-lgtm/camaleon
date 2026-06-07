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
import { Toast } from "@/components/ui/Toast";

type ToastItem = {
  id: number;
  message: string;
  variant: "success" | "info";
};

type ToastFn = (opts: { message: string; variant?: "success" | "info" }) => void;

const ToastContext = createContext<{ toast: ToastFn } | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toast = useCallback<ToastFn>(
    ({ message, variant = "info" }) => {
      clearTimer();
      setItem({ id: ++toastId, message, variant: variant === "info" ? "info" : "success" });
      timerRef.current = setTimeout(() => {
        setItem(null);
        timerRef.current = null;
      }, 4000);
    },
    [clearTimer]
  );

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {item && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <Toast
            message={item.message}
            variant={item.variant}
            onDismiss={() => {
              clearTimer();
              setItem(null);
            }}
          />
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): { toast: ToastFn } {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
