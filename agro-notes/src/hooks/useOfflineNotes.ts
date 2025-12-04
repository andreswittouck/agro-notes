// src/hooks/useOfflineNotes.ts
"use client";

import { useEffect, useState } from "react";
import type { LocalNote, CreateNotePayload } from "@/types/note.type";
import {
  getAllLocalNotes,
  saveManyNotesToLocal,
  createNoteOfflineFirst,
  syncNotes,
  updateNoteOfflineFirst,
  deleteNoteOfflineFirst,
} from "@/lib/offline/notesOffline";
import { listNotes } from "@/lib/api";

type Filter = { farm?: string; lot?: string };

export function useOfflineNotes() {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>({});

  async function reload(newFilter?: Filter) {
    setLoading(true);

    if (newFilter) setFilter(newFilter);

    // 1) siempre leemos IndexedDB
    const local = await getAllLocalNotes();
    setNotes(local);

    // 2) si hay internet, pedimos notas "full" y actualizamos local
    if (navigator.onLine) {
      try {
        const apiNotes = await listNotes(newFilter ?? filter);
        await saveManyNotesToLocal(apiNotes);
        const updated = await getAllLocalNotes();
        setNotes(updated);
      } catch (e) {
        console.error("Error loading online notes:", e);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    // carga inicial
    void reload();

    if (typeof window === "undefined") return;

    // cuando arranca online, intentamos sincronizar
    if (navigator.onLine) {
      void (async () => {
        await syncNotes();
        await reload();
      })();
    }

    // nos suscribimos al evento "online" para sincronizar cuando vuelva la señal
    const handler = () => {
      (async () => {
        await syncNotes();
        await reload();
      })();
    };

    window.addEventListener("online", handler);

    return () => {
      window.removeEventListener("online", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addNote(
    payload: Omit<CreateNotePayload, "id" | "created_at">
  ) {
    const newNote = await createNoteOfflineFirst(payload);
    setNotes((prev) => [newNote, ...prev]);
  }

  async function editNote(
    id: string,
    changes: Partial<Omit<CreateNotePayload, "id" | "created_at">>
  ) {
    const updated = await updateNoteOfflineFirst(id, changes);
    if (!updated) return;
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  }

  async function removeNote(id: string) {
    await deleteNoteOfflineFirst(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return { notes, loading, addNote, reload, editNote, removeNote };
}
