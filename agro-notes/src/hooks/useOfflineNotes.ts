// agro-notes/src/hooks/useOfflineNotes.ts
"use client";

import { useEffect, useState } from "react";
import type { LocalNote, CreateNotePayload } from "@/types/notes.type";
import {
  getAllLocalNotes,
  createNoteOfflineFirst,
} from "@/lib/offline/notesOffline";

type Filter = { farm?: string; lot?: string };

export function useOfflineNotes() {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // función para cargar/recargar notas desde IndexedDB
  async function reload(_filter?: Filter) {
    setLoading(true);
    try {
      const local = await getAllLocalNotes();
      // si quisieras filtrar por farm/lot acá, podrías hacerlo:
      // const filtered = local.filter(...)
      setNotes(local);
    } finally {
      setLoading(false);
    }
  }

  // carga inicial
  useEffect(() => {
    void reload();
  }, []);

  async function addNote(
    payload: Omit<CreateNotePayload, "id" | "created_at">
  ) {
    const newNote = await createNoteOfflineFirst(payload);
    setNotes((prev) => [newNote, ...prev]);
  }

  return { notes, loading, addNote, reload };
}
