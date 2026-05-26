"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { setToastCallback } from "@/lib/toast";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2, 10);
    const toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Register the callback for the library
  setToastCallback(showToast);

  return (
    <ToastContext.Provider value={null}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{
              background:
                toast.type === "success"
                  ? "var(--color-success)"
                  : toast.type === "error"
                    ? "var(--color-error)"
                    : "var(--color-info)",
              color: "white",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
