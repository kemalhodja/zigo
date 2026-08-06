"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

type ToastMessage = {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function showToast(message: string, type: ToastType = "info", title?: string) {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  function success(message: string, title?: string) {
    showToast(message, "success", title);
  }

  function error(message: string, title?: string) {
    showToast(message, "error", title);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast, success, error }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              toast.type === "success"
                ? "bg-slate-900/90 border-emerald-500/40 text-emerald-200"
                : toast.type === "error"
                  ? "bg-slate-900/90 border-rose-500/40 text-rose-200"
                  : "bg-slate-900/90 border-amber-400/40 text-amber-200"
            }`}
          >
            <span className="text-xl shrink-0">
              {toast.type === "success" ? "🎉" : toast.type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <div className="flex-1">
              {toast.title ? <h4 className="text-xs font-black uppercase tracking-wider text-white">{toast.title}</h4> : null}
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white text-xs font-bold"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
    };
  }
  return context;
}
