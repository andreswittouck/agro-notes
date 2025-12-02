"use client";

import { db } from "./offlineDb";
import type { LocalNote, CreateNotePayload, ApiNote } from "@/types/notes.type";
import { createNote } from "../api";

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // fallback muy simple
  return `note_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function createNoteOfflineFirst(
  payload: Omit<CreateNotePayload, "id" | "created_at">
): Promise<LocalNote> {
  const now = new Date().toISOString();
  const id = generateId();

  const local: LocalNote = {
    id,
    farm: payload.farm,
    lot: payload.lot,
    weeds: payload.weeds,
    applications: payload.applications,
    note: payload.note,
    lat: payload.lat,
    lng: payload.lng,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    syncStatus: navigator.onLine ? "pending" : "pending", // por ahora siempre pending
    operation: "create",
  };

  // 1) Guardar en IndexedDB
  await db.transaction("rw", db.notes, db.pendingOps, async () => {
    await db.notes.put(local);
    await db.pendingOps.add({
      id: generateId(),
      entity: "note",
      type: "create",
      payload: local,
      createdAt: now,
    });
  });

  // 2) Si hay internet, intentamos sincronizar este registro al toque
  if (navigator.onLine) {
    try {
      const apiNote: ApiNote = await createNote({
        id: local.id,
        farm: local.farm,
        lot: local.lot,
        weeds: local.weeds,
        applications: local.applications,
        note: local.note,
        lat: local.lat,
        lng: local.lng,
        created_at: local.created_at,
      });

      const synced: LocalNote = {
        ...apiNote,
        syncStatus: "synced",
        operation: undefined,
      };

      await db.transaction("rw", db.notes, db.pendingOps, async () => {
        await db.notes.put(synced);
        // opcional: limpiar pendingOps de esta nota
        await db.pendingOps
          .where("entity")
          .equals("note")
          .and((op) => op.type === "create" && op.payload.id === local.id)
          .delete();
      });

      return synced;
    } catch (e) {
      console.error("Error syncing note immediately:", e);
      // si falla, dejamos el pending en DB
    }
  }

  // 3) Si no se pudo sincronizar, devolvemos la versión local pending
  return local;
}

export async function getAllLocalNotes(): Promise<LocalNote[]> {
  return db.notes.orderBy("created_at").reverse().toArray();
}
