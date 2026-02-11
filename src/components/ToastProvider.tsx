"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "default" | "success" | "error";

type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    setToasts((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...toast,
      },
    ]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {/* Simple toast stack in bottom-right corner */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className={`min-w-[220px] rounded-md border bg-card px-4 py-3 text-left shadow-md transition hover:brightness-105 ${
              toast.variant === "success"
                ? "border-emerald-500/40"
                : toast.variant === "error"
                  ? "border-rose-500/40"
                  : ""
            }`}
          >
            {toast.title && (
              <p className="text-sm font-medium">{toast.title}</p>
            )}
            {toast.description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {toast.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}


