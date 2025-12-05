"use client";

import { theme } from "@/theme";
import { Card } from "./ui/Card";
import type { LocalNote } from "@/types/note.type";

type Props = {
  n: LocalNote;
  onEdit?: (note: LocalNote) => void;
  onDelete?: (note: LocalNote) => void;
};

export function NoteCard({ n, onEdit, onDelete }: Props) {
  return (
    <Card>
      <div className="p-4 flex flex-col md:flex-row gap-4 md:items-start">
        {/* ---------------------- */}
        {/*     COLUMNA TEXTO      */}
        {/* ---------------------- */}
        <div className="flex-1 space-y-2 text-sm">
          {/* HEADER */}
          <header className="flex flex-wrap items-center gap-2 text-sm">
            <strong className="text-white">{n.farm}</strong>
            <span
              style={{ color: theme.colors.textSecondary }}
              className="text-slate-300 "
            >
              · Lote {n.lot}
            </span>
            <span
              style={{ color: theme.colors.textSecondary }}
              className="ml-auto text-xs text-slate-400 whitespace-nowrap"
            >
              {new Date(n.created_at).toLocaleString()}
            </span>
          </header>

          {/* CAMPOS */}
          <div>
            <b
              style={{ color: theme.colors.textSecondary }}
              className="text-slate-400 "
            >
              Malezas:
            </b>{" "}
            <span className="text-white">{n.weeds.join(", ") || "—"}</span>
          </div>

          <div>
            <b
              style={{ color: theme.colors.textSecondary }}
              className="text-slate-400"
            >
              Aplicaciones:
            </b>{" "}
            <span className="text-white">
              {n.applications.join(", ") || "—"}
            </span>
          </div>

          {n.note && (
            <div>
              <b
                style={{ color: theme.colors.textSecondary }}
                className="text-slate-400"
              >
                Nota:
              </b>{" "}
              <span className="text-white">{n.note}</span>
            </div>
          )}

          {n.lat && n.lng && (
            <div>
              <b
                style={{ color: theme.colors.textSecondary }}
                className="text-slate-400"
              >
                GPS:
              </b>{" "}
              <span
                style={{ color: theme.colors.textSecondary }}
                className="text-slate-300"
              >
                {n.lat.toFixed(5)}, {n.lng.toFixed(5)}
              </span>
            </div>
          )}
        </div>

        {/* ---------------------- */}
        {/*     BOTONES ACCIONES   */}
        {/* ---------------------- */}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 justify-end md:flex-col md:items-end md:justify-center">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(n)}
                className="
                  flex items-center gap-1
                  bg-orange-600 hover:bg-orange-700
                  text-white text-xs font-medium
                  px-3 py-2 rounded-md
                "
              >
                ✏️
                <span className="hidden md:inline">Editar</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(n)}
                className="
                  flex items-center gap-1
                  bg-red-600 hover:bg-red-700
                  text-white text-xs font-medium
                  px-3 py-2 rounded-md
                "
              >
                🗑️
                <span className="hidden md:inline">Eliminar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
