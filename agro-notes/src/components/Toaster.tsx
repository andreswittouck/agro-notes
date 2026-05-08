"use client";

import { useCallback, useEffect, useState } from "react";
import { onSync } from "@/lib/offline/syncEvents";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  text: string;
};

const TOAST_DURATION_MS = 3500;

let nextId = 1;

/**
 * Toaster global montado una vez en el layout. Escucha eventos del bus
 * de sync y muestra una notificación efímera arriba a la derecha.
 *
 * No usa librería de toasts: estado local + setTimeout. Si en el futuro
 * se quiere disparar toasts desde otros lugares, basta con exportar una
 * función `showToast(...)` y conectar con un event bus aparte.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((tone: ToastTone, text: string) => {
    const id = nextId++;
    setToasts((ts) => [...ts, { id, tone, text }]);
    setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    const offEnd = onSync("sync:end", (d) => {
      if (d.failed > 0) {
        show(
          "error",
          `${d.failed} nota${
            d.failed === 1 ? "" : "s"
          } no se pudo sincronizar — se reintenta luego`
        );
        return;
      }
      const total = d.pendingProcessed + d.changesPulled;
      if (total === 0) return; // sync vacío: no molestamos al usuario
      const parts: string[] = [];
      if (d.pendingProcessed > 0) {
        parts.push(
          `${d.pendingProcessed} enviada${d.pendingProcessed === 1 ? "" : "s"}`
        );
      }
      if (d.changesPulled > 0) {
        parts.push(
          `${d.changesPulled} actualizada${d.changesPulled === 1 ? "" : "s"}`
        );
      }
      show("success", `Sincronizado · ${parts.join(", ")}`);
    });
    const offErr = onSync("sync:error", () => {
      show("error", "Error al sincronizar");
    });
    return () => {
      offEnd();
      offErr();
    };
  }, [show]);

  return (
    <div
      className="
        fixed top-3 right-3 z-50
        flex flex-col gap-2
        max-w-[calc(100vw-1.5rem)]
        pointer-events-none
      "
      style={{
        top: "calc(0.75rem + env(safe-area-inset-top, 0px))",
      }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const tones: Record<ToastTone, string> = {
    success: "bg-success/15 text-fg border-success/40",
    error: "bg-mic-active/15 text-fg border-mic-active/40",
    info: "bg-accent/15 text-fg border-accent/40",
  };
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={[
        "pointer-events-auto",
        "rounded-lg px-3 py-2",
        "text-sm leading-snug",
        "border shadow-lg backdrop-blur",
        "animate-fade-in-up",
        tones[toast.tone],
      ].join(" ")}
    >
      {toast.text}
    </div>
  );
}
