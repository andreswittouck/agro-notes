"use client";

import Dexie, { Table } from "dexie";
import type { LocalNote } from "@/types/note.type";

export type PendingOperationType = "create" | "update" | "delete";

export type PendingOperation = {
  id: string; // UUID de la operación
  entity: "note";
  type: PendingOperationType;
  payload: any; // normalmente LocalNote o parte de ella
  createdAt: string; // ISO
};

class AgroNotesDB extends Dexie {
  notes!: Table<LocalNote, string>;
  pendingOps!: Table<PendingOperation, string>;

  constructor() {
    super("AgroNotesDB");

    // -----------------------------------------------------------------
    // v1 — schema original (sin owner_email / is_private).
    // -----------------------------------------------------------------
    this.version(1).stores({
      notes: "id, created_at, updated_at, farm, lot, syncStatus",
      pendingOps: "id, entity, type, createdAt",
    });

    // -----------------------------------------------------------------
    // v2 — agregar índices por owner_email y is_private. Las filas
    // existentes se mantienen; el código de sync va a refrescar los
    // campos faltantes la primera vez que pulle desde el servidor.
    // -----------------------------------------------------------------
    this.version(2).stores({
      notes:
        "id, created_at, updated_at, farm, lot, syncStatus, owner_email, is_private",
      pendingOps: "id, entity, type, createdAt",
    });
  }
}

/**
 * Singleton lazy del wrapper de Dexie.
 *
 * En Next.js App Router, todas las páginas (aunque sean `"use client"`)
 * pasan por un prerender en Node durante el build (`next build`).
 * Dexie tira `ReferenceError: indexedDB is not defined` si se instancia
 * en ese contexto. Para que el build no rompa, posponemos la creación
 * hasta el primer acceso del lado del browser.
 *
 * Se expone como un Proxy para mantener la API original — los callers
 * siguen escribiendo `db.notes.put(...)` sin saber del lazy load.
 */
let _instance: AgroNotesDB | null = null;

function getInstance(): AgroNotesDB {
  if (typeof window === "undefined") {
    throw new Error(
      "AgroNotesDB solo está disponible en el navegador (IndexedDB)",
    );
  }
  if (!_instance) {
    _instance = new AgroNotesDB();
  }
  return _instance;
}

export const db = new Proxy({} as AgroNotesDB, {
  get(_target, prop, receiver) {
    return Reflect.get(getInstance(), prop, receiver);
  },
}) as AgroNotesDB;
