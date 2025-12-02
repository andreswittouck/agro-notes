// agro-notes/src/app/notes/page.tsx
"use client";

import { useState } from "react";
import { PageContainer } from "../../components/ui/PageContainer";
import { Row } from "../../components/ui/Row";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { NoteCard } from "../../components/NoteCard";
import { theme } from "../../theme";

import { useOfflineNotes } from "../../hooks/useOfflineNotes";
import type { LocalNote } from "@/types/notes.type";

export default function NotesPage() {
  const [farm, setFarm] = useState("");
  const [lot, setLot] = useState("");

  const { notes, loading, reload } = useOfflineNotes();

  const handleFilter = async () => {
    await reload({
      farm: farm || undefined,
      lot: lot || undefined,
    });
    // por ahora reload trae todo desde IndexedDB.
    // Más adelante podemos aplicar el filtro adentro del hook o acá en memoria.
  };

  // si querés que el filtro se aplique en memoria ya mismo:
  const filteredNotes = notes.filter((n) => {
    const matchFarm = farm
      ? n.farm.toLowerCase().includes(farm.toLowerCase())
      : true;
    const matchLot = lot
      ? n.lot.toLowerCase().includes(lot.toLowerCase())
      : true;
    return matchFarm && matchLot;
  });

  return (
    <PageContainer>
      <header style={{ display: "grid", gap: theme.spacing(2) }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: theme.spacing(2),
          }}
        >
          <h1
            style={{
              fontSize: "1.1rem",
              margin: 0,
              fontWeight: 600,
            }}
          >
            Notas
          </h1>

          <a
            href="/voice-note"
            style={{
              marginLeft: "auto",
              textDecoration: "none",
              fontSize: "0.9rem",
              color: theme.colors.bgAccent,
            }}
          >
            + Nueva por voz
          </a>
        </div>

        <Row>
          <Input
            placeholder="Explotación"
            value={farm}
            onChange={(e) => setFarm(e.target.value)}
            style={{ flex: "1 1 140px" }}
          />
          <Input
            placeholder="Lote"
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            style={{ flex: "1 1 100px" }}
          />
          <Button
            onClick={handleFilter}
            disabled={loading}
            style={{ flexShrink: 0, minWidth: "90px" }}
          >
            {loading ? "Cargando…" : "Filtrar"}
          </Button>
        </Row>
      </header>

      <section
        style={{
          display: "grid",
          gap: theme.spacing(3),
        }}
      >
        {filteredNotes.map((n: LocalNote) => (
          <NoteCard key={n.id} n={n} />
        ))}

        {!filteredNotes.length && !loading && (
          <div
            style={{
              color: theme.colors.textSecondary,
              fontSize: "0.9rem",
              textAlign: "center",
              padding: theme.spacing(6),
            }}
          >
            No hay notas.
          </div>
        )}
      </section>
    </PageContainer>
  );
}
