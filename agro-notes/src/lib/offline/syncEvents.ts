"use client";

/**
 * Mini event bus para la sincronización de notas.
 *
 * `notesOffline.syncNotes()` dispara eventos cuando arranca, termina o
 * falla una sincronización. La UI (badge, toaster) los escucha sin
 * acoplarse al módulo de offline.
 *
 *   import { onSync, emitSync } from "@/lib/offline/syncEvents";
 *
 *   const off = onSync("sync:end", (detail) => { ... });
 *   off(); // remueve el listener
 *
 *   emitSync("sync:start", null);
 */

export type SyncEndDetail = {
  /** Cantidad de pendingOps que se procesaron OK contra el servidor. */
  pendingProcessed: number;
  /** Cantidad de notas que el servidor devolvió como cambiadas. */
  changesPulled: number;
  /** pendingOps que tiraron error y quedan para el próximo intento. */
  failed: number;
};

export type SyncErrorDetail = {
  error: unknown;
};

export type SyncEventMap = {
  "sync:start": null;
  "sync:end": SyncEndDetail;
  "sync:error": SyncErrorDetail;
};

const target: EventTarget | null =
  typeof window !== "undefined" ? new EventTarget() : null;

export function emitSync<K extends keyof SyncEventMap>(
  type: K,
  detail: SyncEventMap[K]
): void {
  if (!target) return;
  target.dispatchEvent(new CustomEvent(type, { detail }));
}

export function onSync<K extends keyof SyncEventMap>(
  type: K,
  handler: (detail: SyncEventMap[K]) => void
): () => void {
  if (!target) return () => {};
  const listener = (e: Event) => {
    handler((e as CustomEvent<SyncEventMap[K]>).detail);
  };
  target.addEventListener(type, listener);
  return () => target.removeEventListener(type, listener);
}
