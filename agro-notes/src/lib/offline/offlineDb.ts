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

    this.version(1).stores({
      // índice primario: id
      // índices secundarios: created_at, updated_at, farm, lot, syncStatus
      notes: "id, created_at, updated_at, farm, lot, syncStatus",
      pendingOps: "id, entity, type, createdAt",
    });
  }
}

export const db = new AgroNotesDB();
