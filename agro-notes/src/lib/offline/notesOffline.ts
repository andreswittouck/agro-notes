// src/lib/offline/notesOffline.ts
"use client";

import { db } from "./offlineDb";
import type { LocalNote, CreateNotePayload, ApiNote } from "@/types/note.type";
import { createNote, listNoteChanges } from "../api";

const LAST_SYNC_KEY = "agro-notes:lastSync";

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `note_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getLastSync(): string {
  if (typeof window === "undefined") return "1970-01-01T00:00:00.000Z";
  return localStorage.getItem(LAST_SYNC_KEY) ?? "1970-01-01T00:00:00.000Z";
}

function setLastSync(iso: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, iso);
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
    syncStatus: "pending",
    operation: "create",
  };

  // 1) guardar siempre local + pending op
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

  // 2) si no hay internet, queda pendiente para sync futura
  if (!navigator.onLine) {
    return local;
  }

  // 3) si hay internet, intentamos sincronizar YA
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
      await db.pendingOps
        .where("entity")
        .equals("note")
        .and((op) => op.type === "create" && op.payload.id === local.id)
        .delete();
    });

    // actualizamos lastSync porque el server ya conoce esta nota
    setLastSync(new Date().toISOString());

    return synced;
  } catch (e) {
    console.error("Error syncing note immediately:", e);
    return local;
  }
}

export async function saveManyNotesToLocal(apiNotes: ApiNote[]) {
  const localNotes: LocalNote[] = apiNotes.map((n) => ({
    ...n,
    syncStatus: "synced",
    operation: undefined,
  }));

  await db.notes.bulkPut(localNotes);
}

export async function getAllLocalNotes(): Promise<LocalNote[]> {
  return db.notes.orderBy("created_at").reverse().toArray();
}

/**
 * Sincroniza:
 * 1) pendingOps -> API
 * 2) cambios desde lastSync <- API
 */
export async function syncNotes(params?: { farm?: string; lot?: string }) {
  if (!navigator.onLine) return;

  console.log("[sync] Starting notes sync...");

  // 1) mandar pendientes al backend
  const pending = await db.pendingOps.where("entity").equals("note").toArray();

  for (const op of pending) {
    try {
      if (op.type === "create") {
        const p = op.payload as LocalNote;

        const apiNote: ApiNote = await createNote({
          id: p.id,
          farm: p.farm,
          lot: p.lot,
          weeds: p.weeds,
          applications: p.applications,
          note: p.note,
          lat: p.lat,
          lng: p.lng,
          created_at: p.created_at,
        });

        const synced: LocalNote = {
          ...apiNote,
          syncStatus: "synced",
          operation: undefined,
        };

        await db.transaction("rw", db.notes, db.pendingOps, async () => {
          await db.notes.put(synced);
          await db.pendingOps.delete(op.id);
        });
      }

      // aquí más adelante podés manejar "update" / "delete"
    } catch (e) {
      console.error("[sync] Error syncing pending op", op, e);
      // no borramos la op, se reintenta en el próximo sync
    }
  }

  // 2) traer cambios del backend desde lastSync
  const since = getLastSync();

  try {
    const changes = await listNoteChanges(since, params);
    if (changes.length) {
      await saveManyNotesToLocal(changes);
    }
    setLastSync(new Date().toISOString());
    console.log(
      `[sync] Notes sync done. Pending: ${pending.length}, changes: ${changes.length}`
    );
  } catch (e) {
    console.error("[sync] Error fetching changes from API:", e);
  }
}
