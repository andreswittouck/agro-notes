"use client";
import { useEffect, useState } from "react";
import { listNotes, type Note } from "../../lib/api";

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
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1>Notes</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Farm"
          value={farm}
          onChange={(e) => setFarm(e.target.value)}
        />
        <input
          placeholder="Lot"
          value={lot}
          onChange={(e) => setLot(e.target.value)}
        />
        <button onClick={load} disabled={loading}>
          {loading ? "Cargando…" : "Filtrar"}
        </button>
        <a href="/voice-note" style={{ marginLeft: "auto" }}>
          + Nueva por voz
        </a>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {notes.map((n) => (
          <article
            key={n.id}
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
          >
            <header
              style={{ display: "flex", gap: 12, alignItems: "baseline" }}
            >
              <strong>{n.farm}</strong>
              <span>· Lot {n.lot}</span>
              <span style={{ marginLeft: "auto", opacity: 0.6 }}>
                {new Date(n.created_at).toLocaleString()}
              </span>
            </header>
            <div style={{ fontSize: 14, marginTop: 6 }}>
              <div>
                <b>Weeds:</b> {n.weeds.join(", ") || "—"}
              </div>
              <div>
                <b>Applications:</b> {n.applications.join(", ") || "—"}
              </div>
              {n.note && (
                <div>
                  <b>Note:</b> {n.note}
                </div>
              )}
              {n.lat !== undefined && n.lng !== undefined && (
                <div style={{ opacity: 0.7 }}>
                  <b>GPS:</b> {n.lat.toFixed(5)}, {n.lng.toFixed(5)}
                </div>
              )}
            </div>
          </article>
        ))}
        {!notes.length && !loading && <div>No hay notas.</div>}
      </div>
    </main>
  );
}
