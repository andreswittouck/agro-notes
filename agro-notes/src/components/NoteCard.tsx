// agro-notes/src/components/NoteCard.tsx
"use client";

import { Card } from "./ui/Card";
import type { LocalNote } from "@/types/note.type";
import { useMe } from "@/contexts/MeContext";

type Props = {
  n: LocalNote;
  onEdit?: (note: LocalNote) => void;
  onDelete?: (note: LocalNote) => void;
};

export function NoteCard({ n, onEdit, onDelete }: Props) {
  const { me, loading: meLoading } = useMe();
  const myEmail = (me?.email ?? "").toLowerCase();
  const isMine = !!n.owner_email && n.owner_email.toLowerCase() === myEmail;
  // Si todavía no terminamos de cargar `me`, mostramos los botones de
  // todas formas (fail-open en UI). El backend igual valida y, si no
  // corresponde, devuelve 403 — es mejor que esconder los botones
  // mientras /me carga.
  // Si una nota local no tiene owner_email (por ejemplo si se creó
  // antes del Hito 2), también dejamos modificarla: solo el dueño
  // verá la nota igual, así que no hay riesgo real.
  const canModify =
    meLoading ||
    !me ||
    isMine ||
    me.isAdmin === true ||
    !n.owner_email;

  const created = new Date(n.created_at);
  const dateLabel = created.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card padding={4}>
      <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
        {/* ----------- COLUMNA TEXTO ----------- */}
        <div className="flex-1 min-w-0 grid gap-2 text-sm">
          {/* HEADER de la nota */}
          <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <strong className="text-fg text-base font-semibold leading-tight">
              {n.farm}
            </strong>
            <span className="text-fg-muted text-sm">·</span>
            <span className="text-fg-muted text-sm">Lote {n.lot}</span>
            <span className="ml-auto shrink-0 text-xs text-fg-subtle whitespace-nowrap">
              {dateLabel}
            </span>
          </header>

          {/* Badges de propiedad */}
          {(n.is_private || !isMine) && (
            <div className="flex flex-wrap gap-1.5 -mt-0.5">
              {!isMine && n.owner_email && (
                <Badge tone="info" title={`Compartida por ${n.owner_email}`}>
                  <Dot tone="info" />
                  Compartida por {shortEmail(n.owner_email)}
                </Badge>
              )}
              {n.is_private && (
                <Badge tone="muted" title="Solo el dueño y los admins ven esta nota">
                  <LockIcon />
                  Privada
                </Badge>
              )}
            </div>
          )}

          {/* CAMPOS */}
          <Row label="Malezas" value={n.weeds.join(", ") || "—"} />
          <Row
            label="Aplicaciones"
            value={n.applications.join(", ") || "—"}
          />

          {n.note && <Row label="Nota" value={n.note} />}

          {n.lat != null && n.lng != null && (
            <Row
              label="GPS"
              value={`${n.lat.toFixed(5)}, ${n.lng.toFixed(5)}`}
              valueClassName="text-fg-muted text-xs font-mono"
            />
          )}

          {n.syncStatus && n.syncStatus !== "synced" && (
            <span
              className={[
                "inline-flex items-center gap-1.5 self-start",
                "text-xs px-2 py-0.5 rounded-full mt-1",
                n.syncStatus === "pending"
                  ? "bg-warning-bg text-warning-fg"
                  : "bg-mic-active/15 text-mic-active",
              ].join(" ")}
            >
              <span
                className={[
                  "w-1.5 h-1.5 rounded-full",
                  n.syncStatus === "pending"
                    ? "bg-warning-fg"
                    : "bg-mic-active",
                ].join(" ")}
              />
              {n.syncStatus === "pending" ? "Pendiente sync" : "Error sync"}
            </span>
          )}
        </div>

        {/* ----------- BOTONES ACCIONES ----------- */}
        {(onEdit || onDelete) && canModify && (
          <div
            className="
              flex flex-row md:flex-col
              gap-2
              justify-end md:justify-start
              shrink-0
            "
          >
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(n)}
                aria-label="Editar nota"
                className="
                  inline-flex items-center gap-1.5
                  text-xs font-medium text-fg
                  bg-transparent hover:bg-card-hover
                  border border-border-subtle hover:border-accent
                  rounded-md px-3 py-1.5
                  transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card
                  cursor-pointer
                "
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                <span className="hidden md:inline">Editar</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(n)}
                aria-label="Eliminar nota"
                className="
                  inline-flex items-center gap-1.5
                  text-xs font-medium text-mic-active
                  bg-transparent hover:bg-mic-active/10
                  border border-border-subtle hover:border-mic-active
                  rounded-md px-3 py-1.5
                  transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-mic-active focus-visible:ring-offset-2 focus-visible:ring-offset-card
                  cursor-pointer
                "
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                <span className="hidden md:inline">Eliminar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ----------------- helpers internos -----------------

function Row({
  label,
  value,
  valueClassName = "text-fg",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="leading-snug">
      <span className="text-fg-muted text-xs uppercase tracking-wide mr-1.5">
        {label}:
      </span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

type Tone = "info" | "muted";

function Badge({
  children,
  tone,
  title,
}: {
  children: React.ReactNode;
  tone: Tone;
  title?: string;
}) {
  const styles: Record<Tone, string> = {
    info: "bg-accent/10 text-accent border-accent/30",
    muted: "bg-page/60 text-fg-muted border-border-subtle",
  };
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center gap-1.5",
        "text-xs px-2 py-0.5 rounded-full border",
        styles[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Dot({ tone }: { tone: Tone }) {
  const styles: Record<Tone, string> = {
    info: "bg-accent",
    muted: "bg-fg-muted",
  };
  return (
    <span
      aria-hidden="true"
      className={["w-1.5 h-1.5 rounded-full", styles[tone]].join(" ")}
    />
  );
}

function LockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/** Acortar email para que no rompa el layout: `andres@gmail.com` → `andres@gmail.…`. */
function shortEmail(email: string): string {
  if (email.length <= 22) return email;
  return email.slice(0, 21) + "…";
}
