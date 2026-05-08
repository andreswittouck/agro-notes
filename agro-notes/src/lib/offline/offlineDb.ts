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

export const db = new AgroNotesDB();
