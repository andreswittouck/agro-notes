// agro-notes/src/app/notes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PageContainer } from "../../components/ui/PageContainer";
import { AuthGuard } from "../../components/AuthGuard";
import { Row } from "../../components/ui/Row";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { NoteCard } from "../../components/NoteCard";

import { useOfflineNotes } from "../../hooks/useOfflineNotes";
import { useMe } from "../../contexts/MeContext";
import type { LocalNote } from "@/types/note.type";
import { deleteNoteOfflineFirst } from "@/lib/offline/notesOffline";

export default function NotesPage() {
  const [farm, setFarm] = useState("");
  const [lot, setLot] = useState("");
  const router = useRouter();

  // Scope viene del MeContext: solo es "all" si el usuario es admin y
  // movió el switch del header.
  const { scope } = useMe();
  const { notes, loading, reload } = useOfflineNotes({ scope });

  // Cuando el admin cambia el scope desde el header, recargamos.
  useEffect(() => {
    void reload({ scope });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const handleFilter = async () => {
    await reload({
      farm: farm || undefined,
      lot: lot || undefined,
      scope,
    });
  };

  const handleClear = async () => {
    setFarm("");
    setLot("");
    await reload({ farm: undefined, lot: undefined, scope });
  };

  const filteredNotes = notes.filter((n) => {
    // Ocultar las que se borraron localmente (deleted_at seteado pero
    // todavía no se sincronizó la baja). Si se sincronizó OK, ya no
    // están en IndexedDB.
    if (n.deleted_at) return false;
    const matchFarm = farm
      ? n.farm.toLowerCase().includes(farm.toLowerCase())
      : true;
    const matchLot = lot
      ? n.lot.toLowerCase().includes(lot.toLowerCase())
      : true;
    return matchFarm && matchLot;
  });

  const handleEdit = (note: LocalNote) => {
    const params = new URLSearchParams({
      mode: "edit",
      id: note.id,
      farm: note.farm,
      lot: note.lot,
      weeds: note.weeds.join(","),
      applications: note.applications.join(","),
      note: note.note ?? "",
      is_private: note.is_private ? "1" : "0",
    });
    router.push(`/voice-note?${params.toString()}`);
  };

  const handleDelete = async (note: LocalNote) => {
    const ok = confirm("¿Eliminar esta nota?");
    if (!ok) return;
    try {
      await deleteNoteOfflineFirst(note.id);
      await reload({ scope });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar";
      alert(msg);
    }
  };

  return (
    <AuthGuard>
      <PageContainer>
        <header className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="m-0 text-xl font-semibold tracking-tight">
              Notas
            </h1>
            <span className="text-xs text-fg-muted">
              {filteredNotes.length} {filteredNotes.length === 1 ? "nota" : "notas"}
            </span>

            <Link
              href="/voice-note"
              className="
                ml-auto inline-flex items-center gap-1.5
                text-sm font-medium text-fg
                bg-accent hover:bg-accent-hover
                rounded-lg px-3 py-1.5
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva por voz
            </Link>
          </div>

          <Row>
            <Input
              placeholder="Explotación"
              value={farm}
              onChange={(e) => setFarm(e.target.value)}
              full={false}
              className="flex-1 min-w-[140px]"
            />
            <Input
              placeholder="Lote"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              full={false}
              className="flex-1 min-w-[100px]"
            />
            <Button onClick={handleFilter} disabled={loading}>
              {loading ? "Cargando…" : "Filtrar"}
            </Button>
            {(farm || lot) && (
              <Button onClick={handleClear} variant="ghost" disabled={loading}>
                Limpiar
              </Button>
            )}
          </Row>
        </header>

        <section className="grid gap-3">
          {filteredNotes.map((n) => (
            <NoteCard
              key={n.id}
              n={n}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {!filteredNotes.length && !loading && <EmptyState />}
        </section>
      </PageContainer>
    </AuthGuard>
  );
}

function EmptyState() {
  return (
    <div className="
      flex flex-col items-center justify-center text-center gap-3
      py-12 px-4
      rounded-xl
      border border-dashed border-border-subtle
      bg-card/40
    ">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-fg-muted"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <div className="grid gap-1">
        <p className="m-0 text-sm font-medium text-fg">
          Todavía no hay notas
        </p>
        <p className="m-0 text-xs text-fg-muted">
          Empezá creando una con voz desde el botón de arriba.
        </p>
      </div>
    </div>
  );
}
