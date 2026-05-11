// src/hooks/useOfflineNotes.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  LocalNote,
  CreateNotePayload,
  Scope,
} from "@/types/note.type";
import {
  getAllLocalNotes,
  saveManyNotesToLocal,
  createNoteOfflineFirst,
  syncNotes,
  updateNoteOfflineFirst,
  deleteNoteOfflineFirst,
} from "@/lib/offline/notesOffline";
import { listNotes } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Filter = { farm?: string; lot?: string; scope?: Scope };

export function useOfflineNotes(initial?: Filter) {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(initial ?? {});

  const reload = useCallback(
    async (newFilter?: Filter) => {
      setLoading(true);

      const next: Filter = newFilter ? { ...filter, ...newFilter } : filter;
      if (newFilter) setFilter(next);

      // 1) leemos siempre IndexedDB primero (funciona sin sesión)
      const local = await getAllLocalNotes();
      setNotes(local);

      // 2) si hay internet Y user logueado, refrescamos contra la API.
      // Sin user, no llamamos al backend: caería con 401 sin sentido.
      if (navigator.onLine && user) {
        try {
          const apiNotes = await listNotes(next);
          await saveManyNotesToLocal(apiNotes);
          const updated = await getAllLocalNotes();
          setNotes(updated);
        } catch (e) {
          console.error("Error loading online notes:", e);
        }
      }

      setLoading(false);
    },
    [filter, user]
  );

  useEffect(() => {
    // Espera a que Firebase termine de cargar el estado antes de
    // intentar nada online. La lectura local sigue inmediata.
    if (authLoading) return;

    void reload();

    if (typeof window === "undefined") return;

    if (navigator.onLine && user) {
      void (async () => {
        await syncNotes(filter);
        await reload();
      })();
    }

    const handler = () => {
      if (!user) return;
      (async () => {
        await syncNotes(filter);
        await reload();
      })();
    };
    window.addEventListener("online", handler);

    return () => {
      window.removeEventListener("online", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

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

  return { notes, loading, addNote, reload, editNote, removeNote, filter };
}
