// agro-notes/src/hooks/useOfflineNotes.ts
"use client";

import { useEffect, useState } from "react";
import type { LocalNote, CreateNotePayload } from "@/types/note.type";

import {
  getAllLocalNotes,
  saveManyNotesToLocal,
  createNoteOfflineFirst,
} from "@/lib/offline/notesOffline";

import { listNotes } from "@/lib/api";

type Filter = { farm?: string; lot?: string };

export function useOfflineNotes() {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>({});

  // carga inicial y reload manual
  async function reload(newFilter?: Filter) {
    setLoading(true);

    if (newFilter) setFilter(newFilter);

    // 1) cargar siempre desde IndexedDB
    const local = await getAllLocalNotes();
    setNotes(local);

    // 2) si hay internet → pedir al backend
    if (navigator.onLine) {
      try {
        const apiNotes = await listNotes(newFilter ?? filter);

        // guardar en indexedDB
        await saveManyNotesToLocal(apiNotes);

        // volver a leer para incluir las nuevas
        const updatedLocal = await getAllLocalNotes();
        setNotes(updatedLocal);
      } catch (e) {
        console.error("Error loading online notes:", e);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    reload(); // carga inicial
  }, []);

  async function addNote(
    payload: Omit<CreateNotePayload, "id" | "created_at">
  ) {
    const newNote = await createNoteOfflineFirst(payload);
    setNotes((prev) => [newNote, ...prev]);
  }

  return { notes, loading, addNote, reload };
}
