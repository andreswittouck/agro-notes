// agro-notes/src/app/notes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { listNotes, type Note } from "../../lib/api";
import { PageContainer } from "../../components/ui/PageContainer";
import { Row } from "../../components/ui/Row";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { NoteCard } from "../../components/NoteCard";
import { theme } from "../../theme";

export default function NotesPage() {
  const [farm, setFarm] = useState("");
  const [lot, setLot] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listNotes({
        farm: farm || undefined,
        lot: lot || undefined,
      });
      setNotes(data);
    } catch {
      alert("Error cargando notas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            onClick={load}
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
        {notes.map((n) => (
          <NoteCard key={n.id} n={n} />
        ))}

        {!notes.length && !loading && (
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
