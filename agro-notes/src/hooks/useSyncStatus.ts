"use client";

import { useEffect, useState, useCallback } from "react";
import { liveQuery } from "dexie";
import { db } from "@/lib/offline/offlineDb";
import { syncNotes } from "@/lib/offline/notesOffline";
import { onSync } from "@/lib/offline/syncEvents";

const LAST_SYNC_KEY = "agro-notes:lastSync";

export type SyncStatus = {
  /** True si el navegador reporta conexión. */
  online: boolean;
  /** True mientras hay un sync en curso (entre sync:start y sync:end/error). */
  syncing: boolean;
  /** Cantidad de notas con syncStatus distinto de "synced" (pending + error). */
  pendingCount: number;
  /** Cantidad de notas con syncStatus = "error". */
  errorCount: number;
  /** Última fecha en que un sync terminó OK (la que setea `setLastSync`). */
  lastSyncAt: Date | null;
  /** Disparar un sync manualmente. No-op si está offline o ya sincronizando. */
  triggerSync: () => Promise<void>;
};

function readLastSync(): Date | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LAST_SYNC_KEY);
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Estado consolidado de la sincronización offline-first.
 * - `pendingCount` se actualiza reactivamente vía Dexie liveQuery.
 * - `online` escucha los events `online`/`offline` del navegador.
 * - `syncing` y `lastSyncAt` se actualizan vía el bus `syncEvents`.
 */
export function useSyncStatus(): SyncStatus {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(() =>
    readLastSync()
  );

  // ---- online / offline ----
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ---- count de pendientes / errores (reactivo, vía Dexie liveQuery) ----
  useEffect(() => {
    const subPending = liveQuery(() =>
      db.notes.where("syncStatus").equals("pending").count()
    ).subscribe({
      next: (count) => setPendingCount(count),
      error: (e) => console.error("[sync] liveQuery pending error", e),
    });
    const subError = liveQuery(() =>
      db.notes.where("syncStatus").equals("error").count()
    ).subscribe({
      next: (count) => setErrorCount(count),
      error: (e) => console.error("[sync] liveQuery error count error", e),
    });
    return () => {
      subPending.unsubscribe();
      subError.unsubscribe();
    };
  }, []);

  // ---- eventos de sync ----
  useEffect(() => {
    const offStart = onSync("sync:start", () => setSyncing(true));
    const offEnd = onSync("sync:end", () => {
      setSyncing(false);
      setLastSyncAt(readLastSync());
    });
    const offErr = onSync("sync:error", () => setSyncing(false));
    return () => {
      offStart();
      offEnd();
      offErr();
    };
  }, []);

  const triggerSync = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (syncing) return;
    await syncNotes();
  }, [syncing]);

  return {
    online,
    syncing,
    pendingCount: pendingCount + errorCount, // total que falta sincronizar
    errorCount,
    lastSyncAt,
    triggerSync,
  };
}
