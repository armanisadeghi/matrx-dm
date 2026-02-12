"use client";

import { cn } from "@/lib/cn";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

// ── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const COLOR_MAP: Record<ToastVariant, string> = {
  success: "text-success",
  error: "text-destructive",
  info: "text-accent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(message: string, variant: ToastVariant = "info") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICON_MAP[t.variant];

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-xl",
                  "glass min-w-[260px] max-w-[380px]"
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  className={cn("shrink-0", COLOR_MAP[t.variant])}
                />
                <span className="flex-1 text-sm font-medium text-text-primary">
                  {t.message}
                </span>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 rounded-full p-0.5 text-text-tertiary hover:text-text-primary"
                  aria-label="Dismiss"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}
