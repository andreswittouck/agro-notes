// src/lib/offline/notesOffline.ts
"use client";

import { db } from "./offlineDb";
import type {
  LocalNote,
  CreateNotePayload,
  ApiNote,
  Scope,
} from "@/types/note.type";
import {
  createNote,
  listNoteChanges,
  updateNote,
  deleteNote,
} from "../api";
import { auth } from "../firebase";
import { emitSync } from "./syncEvents";

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

/**
 * Email del usuario actual (Firebase). Lo usamos para "stampar" el
 * owner en las notas creadas localmente, así la UI las puede mostrar
 * antes de que el servidor las confirme. El backend igual valida y
 * sobrescribe el owner desde el JWT.
 */
function currentUserEmail(): string {
  return (auth.currentUser?.email ?? "").toLowerCase();
}

export async function createNoteOfflineFirst(
  payload: Omit<CreateNotePayload, "id" | "created_at">
): Promise<LocalNote> {
  const now = new Date().toISOString();
  const id = generateId();

  const local: LocalNote = {
    id,
    owner_email: currentUserEmail(),
    is_private: payload.is_private ?? false,
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

  if (!navigator.onLine) {
    return local;
  }

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
      is_private: local.is_private,
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

    setLastSync(new Date().toISOString());

    return synced;
  } catch (e) {
    console.error("Error syncing note immediately:", e);
    return local;
  }
}

export async function updateNoteOfflineFirst(
  id: string,
  changes: Partial<Omit<CreateNotePayload, "id" | "created_at">>
): Promise<LocalNote | null> {
  const existing = await db.notes.get(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  const updated: LocalNote = {
    ...existing,
    ...changes,
    is_private:
      changes.is_private !== undefined
        ? changes.is_private
        : existing.is_private,
    updated_at: now,
    syncStatus: "pending",
    operation: "update",
  };

  await db.transaction("rw", db.notes, db.pendingOps, async () => {
    await db.notes.put(updated);
    await db.pendingOps.add({
      id: generateId(),
      entity: "note",
      type: "update",
      payload: updated,
      createdAt: now,
    });
  });

  if (!navigator.onLine) return updated;

  try {
    const apiNote: ApiNote = await updateNote(id, {
      farm: updated.farm,
      lot: updated.lot,
      weeds: updated.weeds,
      applications: updated.applications,
      note: updated.note,
      lat: updated.lat,
      lng: updated.lng,
      is_private: updated.is_private,
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
        .and((op) => op.type === "update" && op.payload.id === id)
        .delete();
    });

    return synced;
  } catch (e) {
    console.error("Error syncing note update:", e);
    return updated;
  }
}

export async function deleteNoteOfflineFirst(id: string): Promise<void> {
  const existing = await db.notes.get(id);
  if (!existing) {
    await db.notes.delete(id);
    return;
  }

  const now = new Date().toISOString();

  const deleted: LocalNote = {
    ...existing,
    deleted_at: now,
    syncStatus: "pending",
    operation: "delete",
  };

  await db.transaction("rw", db.notes, db.pendingOps, async () => {
    await db.notes.put(deleted);
    await db.pendingOps.add({
      id: generateId(),
      entity: "note",
      type: "delete",
      payload: { id },
      createdAt: now,
    });
  });

  if (!navigator.onLine) return;

  try {
    await deleteNote(id);
    await db.transaction("rw", db.notes, db.pendingOps, async () => {
      await db.notes.delete(id);
      await db.pendingOps
        .where("entity")
        .equals("note")
        .and((op) => op.type === "delete" && op.payload.id === id)
        .delete();
    });
  } catch (e) {
    console.error("Error syncing note delete:", e);
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
 *
 * Acepta filtros opcionales y un `scope` (admin: 'all' para traer las
 * notas de todos en el pull).
 */
export async function syncNotes(params?: {
  farm?: string;
  lot?: string;
  scope?: Scope;
}) {
  if (!navigator.onLine) return;

  console.log("[sync] Starting notes sync...");
  emitSync("sync:start", null);

  let pendingProcessed = 0;
  let failed = 0;
  let changesPulled = 0;

  try {
    const pending = await db.pendingOps
      .where("entity")
      .equals("note")
      .toArray();

    for (const op of pending) {
      try {
        if (op.type === "create") {
          const p = op.payload as LocalNote;
          const apiNote = await createNote({
            id: p.id,
            farm: p.farm,
            lot: p.lot,
            weeds: p.weeds,
            applications: p.applications,
            note: p.note,
            lat: p.lat,
            lng: p.lng,
            is_private: p.is_private,
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
          pendingProcessed++;
        } else if (op.type === "update") {
          const p = op.payload as LocalNote;
          const apiNote = await updateNote(p.id, {
            farm: p.farm,
            lot: p.lot,
            weeds: p.weeds,
            applications: p.applications,
            note: p.note,
            lat: p.lat,
            lng: p.lng,
            is_private: p.is_private,
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
          pendingProcessed++;
        } else if (op.type === "delete") {
          const { id } = op.payload as { id: string };
          await deleteNote(id);
          await db.transaction("rw", db.notes, db.pendingOps, async () => {
            await db.notes.delete(id);
            await db.pendingOps.delete(op.id);
          });
          pendingProcessed++;
        }
      } catch (e) {
        console.error("[sync] Error syncing pending op", op, e);
        failed++;
        const noteId =
          op.type === "delete"
            ? (op.payload as { id: string }).id
            : (op.payload as LocalNote).id;
        if (noteId) {
          const existing = await db.notes.get(noteId);
          if (existing) {
            await db.notes.put({ ...existing, syncStatus: "error" });
          }
        }
      }
    }

    const since = getLastSync();
    try {
      const changes = await listNoteChanges(since, params);
      if (changes.length) {
        await saveManyNotesToLocal(changes);
        changesPulled = changes.length;
      }
      setLastSync(new Date().toISOString());
      console.log(
        `[sync] Notes sync done. Pending: ${pending.length}, processed: ${pendingProcessed}, failed: ${failed}, changes: ${changesPulled}`
      );
    } catch (e) {
      console.error("[sync] Error fetching changes from API:", e);
    }

    emitSync("sync:end", { pendingProcessed, changesPulled, failed });
  } catch (e) {
    console.error("[sync] Unexpected error in syncNotes:", e);
    emitSync("sync:error", { error: e });
  }
}
