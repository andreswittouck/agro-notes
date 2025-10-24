// agro-notes/src/components/NoteCard.tsx
"use client";

import { Card } from "./ui/Card";
import { theme } from "../theme";
import type { Note } from "../lib/api";

export function NoteCard({ n }: { n: Note }) {
  return (
    <Card>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacing(2),
          alignItems: "baseline",
          marginBottom: theme.spacing(1),
          fontSize: "0.9rem",
        }}
      >
        <strong style={{ color: theme.colors.textPrimary }}>{n.farm}</strong>
        <span style={{ color: theme.colors.textSecondary }}>
          · Lote {n.lot}
        </span>
        <span
          style={{
            marginLeft: "auto",
            color: theme.colors.textSecondary,
            fontSize: "0.75rem",
            whiteSpace: "nowrap",
          }}
        >
          {new Date(n.created_at).toLocaleString()}
        </span>
      </header>

      <div
        style={{
          fontSize: "0.85rem",
          lineHeight: 1.4,
          color: theme.colors.textPrimary,
          display: "grid",
          gap: theme.spacing(1),
        }}
      >
        <div>
          <b style={{ color: theme.colors.textSecondary }}>Malezas:</b>{" "}
          {n.weeds.join(", ") || "—"}
        </div>
        <div>
          <b style={{ color: theme.colors.textSecondary }}>Aplicaciones:</b>{" "}
          {n.applications.join(", ") || "—"}
        </div>
        {n.note && (
          <div>
            <b style={{ color: theme.colors.textSecondary }}>Nota:</b> {n.note}
          </div>
        )}
        {typeof n.lat === "number" &&
          !Number.isNaN(n.lat) &&
          typeof n.lng === "number" &&
          !Number.isNaN(n.lng) && (
            <div style={{ color: theme.colors.textSecondary }}>
              <b>GPS:</b> {n.lat.toFixed(5)}, {n.lng.toFixed(5)}
            </div>
          )}
      </div>
    </Card>
  );
}
