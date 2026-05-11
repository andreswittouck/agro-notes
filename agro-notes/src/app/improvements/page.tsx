// agro-notes/src/app/improvements/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PageContainer } from "@/components/ui/PageContainer";
import { AuthGuard } from "@/components/AuthGuard";
import { BackButton } from "@/components/ui/BackButton";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { MicButton } from "@/components/ui/MicButton";

import {
  addImprovementViewer,
  createImprovement,
  deleteImprovement,
  listImprovementViewers,
  listImprovements,
  removeImprovementViewer,
  updateImprovement,
} from "@/lib/api";
import type {
  Improvement,
  ImprovementViewer,
} from "@/types/improvement.type";

import { useMe } from "@/contexts/MeContext";
import { useSpeech } from "@/components/useSpeech";
import { useMicLevel } from "@/hooks/useMicLevel";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function ImprovementsPage() {
  return (
    <AuthGuard>
      <ImprovementsInner />
    </AuthGuard>
  );
}

function ImprovementsInner() {
  const { me } = useMe();
  const isMobile = useIsMobile();

  const [items, setItems] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listImprovements();
      setItems(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error cargando mejoras";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isAdmin = me?.isAdmin === true;

  return (
    <PageContainer maxWidth="720px">
      <BackButton href="/" label="Volver" />

      <header className="grid gap-1">
        <h1 className="m-0 text-xl font-semibold tracking-tight text-fg">
          Mejoras
        </h1>
        <p className="m-0 text-sm text-fg-muted leading-snug">
          Buzón compartido de ideas para mejorar Agro Notes. Cargá una
          idea con voz o por texto. Solo te ve quien tenga acceso.
        </p>
      </header>

      {error && <Alert tone="error">{error}</Alert>}

      <NewImprovementCard onCreated={reload} isMobile={isMobile} />

      <section className="grid gap-3">
        <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-fg-muted">
          Ideas{" "}
          {items.length > 0 && (
            <span className="text-fg-subtle">· {items.length}</span>
          )}
        </h2>
        {loading ? (
          <p className="m-0 text-sm text-fg-muted">Cargando…</p>
        ) : items.length === 0 ? (
          <EmptyHint>Todavía no hay mejoras cargadas.</EmptyHint>
        ) : (
          items.map((it) => (
            <ImprovementItem
              key={it.id}
              item={it}
              meEmail={(me?.email ?? "").toLowerCase()}
              meIsAdmin={isAdmin}
              onChanged={reload}
            />
          ))
        )}
      </section>

      {isAdmin && <ViewersAdminCard />}

      {/* Spacer en mobile para que los FAB no tapen el contenido del fondo */}
      {isMobile && <div aria-hidden className="h-32" />}
    </PageContainer>
  );
}

// -----------------------------------------------------------------
// Crear mejora — con voz
// -----------------------------------------------------------------

function NewImprovementCard({
  onCreated,
  isMobile,
}: {
  onCreated: () => void | Promise<void>;
  isMobile: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  const {
    supported,
    listening,
    finalTranscript,
    interimTranscript,
    iosStandaloneIssue,
    permissionDenied,
    begin,
    end,
    clear,
  } = useSpeech({ lang: "es-AR" });

  const micLevel = useMicLevel(listening);

  // Cuando se confirma un fragmento "final", lo pegamos al body.
  useEffect(() => {
    if (!finalTranscript) return;
    setBody((prev) => {
      const trimmedPrev = prev.trim();
      const trimmedFinal = finalTranscript.trim();
      if (!trimmedFinal) return prev;
      if (!trimmedPrev) return trimmedFinal;
      if (trimmedPrev.endsWith(trimmedFinal)) return prev;
      return `${trimmedPrev} ${trimmedFinal}`.replace(/\s+/g, " ").trim();
    });
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalTranscript]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError("Escribí o dictá el contenido de la mejora.");
      return;
    }
    setSubmitting(true);
    try {
      await createImprovement({
        title: title.trim() || undefined,
        body: body.trim(),
      });
      setTitle("");
      setBody("");
      await onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo crear";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const showInlineMic = supported && !iosStandaloneIssue && !isMobile;

  return (
    <>
      <Card padding={4}>
        <form ref={formRef} onSubmit={onSubmit} className="grid gap-3">
          <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Nueva mejora
          </h2>

          {error && <Alert tone="error">{error}</Alert>}

          {iosStandaloneIssue && (
            <Alert tone="warning">
              En iPhone instalado como app, el reconocimiento de voz no
              funciona. Abrí Agro Notes desde Safari o cargá la idea
              manualmente.
            </Alert>
          )}
          {!supported && !iosStandaloneIssue && (
            <Alert tone="warning">
              Tu navegador no soporta reconocimiento de voz. Cargá la idea
              manualmente.
            </Alert>
          )}
          {permissionDenied && (
            <Alert tone="error">
              El navegador bloqueó el micrófono. Habilitalo desde el
              candado al lado de la URL.
            </Alert>
          )}

          <Label>
            <span>Título (opcional)</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Búsqueda full-text"
              autoComplete="off"
              autoCapitalize="sentences"
              maxLength={255}
            />
          </Label>

          <Label>
            <span>Contenido</span>
            <TextArea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribí o dictá la idea…"
              rows={4}
            />
          </Label>

          {/* MicButton inline solo en desktop. En mobile va flotante abajo. */}
          {showInlineMic && (
            <div className="flex items-center gap-3 -mt-1">
              <MicButton
                listening={listening}
                onHoldStart={begin}
                onHoldEnd={end}
                size={48}
                level={micLevel}
                ariaLabel="Dictar idea"
              />
              <span className="text-xs text-fg-muted leading-snug min-w-0 flex-1 break-words">
                {listening ? (
                  interimTranscript ? (
                    <span className="italic">{interimTranscript}</span>
                  ) : (
                    "Te escucho…"
                  )
                ) : (
                  "Mantené apretado para dictar."
                )}
              </span>
            </div>
          )}

          {/* En mobile mostramos el feedback del transcript inline; el
              MicButton vive en el FAB. */}
          {isMobile && supported && !iosStandaloneIssue && listening && (
            <p className="m-0 -mt-1 text-xs text-fg-muted italic leading-snug">
              {interimTranscript || "Te escucho…"}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              disabled={submitting || (!title && !body)}
              onClick={() => {
                setTitle("");
                setBody("");
                setError(null);
              }}
            >
              Limpiar
            </Button>
            {/* En mobile el botón Guardar también vive en el FAB; lo
                ocultamos acá para no duplicar. */}
            {!isMobile && (
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Guardando…" : "Guardar idea"}
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* ----- FABs en mobile ----- */}
      {isMobile && supported && !iosStandaloneIssue && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-20 z-40 flex flex-col items-center gap-1.5 pointer-events-none">
          <div className="pointer-events-auto">
            <MicButton
              listening={listening}
              onHoldStart={begin}
              onHoldEnd={end}
              size={72}
              level={micLevel}
              ariaLabel="Dictar idea"
            />
          </div>
          <span
            className="
              pointer-events-none
              text-xs text-fg
              bg-card/90 backdrop-blur
              border border-border-subtle
              rounded-full px-2.5 py-0.5
              shadow-md
            "
          >
            {listening ? "Grabando…" : "Mantener para hablar"}
          </span>
        </div>
      )}

      {isMobile && (
        <button
          type="button"
          onClick={triggerSubmit}
          disabled={submitting}
          aria-label="Guardar idea"
          className="
            fixed right-4 z-40
            inline-flex items-center justify-center
            w-14 h-14 rounded-full
            bg-accent hover:bg-accent-hover text-fg
            shadow-[var(--shadow-fab)]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page
            transition-colors
            cursor-pointer
            disabled:opacity-60 disabled:cursor-not-allowed
          "
          style={{
            bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {submitting ? (
            <Spinner />
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      )}
    </>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// -----------------------------------------------------------------
// Item de la lista — vista + edición inline
// -----------------------------------------------------------------

function ImprovementItem({
  item,
  meEmail,
  meIsAdmin,
  onChanged,
}: {
  item: Improvement;
  meEmail: string;
  meIsAdmin: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const isMine = item.owner_email.toLowerCase() === meEmail;
  const canModify = isMine || meIsAdmin;

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title ?? "");
  const [body, setBody] = useState(item.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(item.title ?? "");
    setBody(item.body);
  }, [item]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError("El contenido no puede estar vacío.");
      return;
    }
    setSaving(true);
    try {
      await updateImprovement(item.id, {
        title: title.trim(),
        body: body.trim(),
      });
      setEditing(false);
      await onChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const ok = confirm("¿Eliminar esta idea?");
    if (!ok) return;
    try {
      await deleteImprovement(item.id);
      await onChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo eliminar";
      alert(msg);
    }
  };

  const dateLabel = new Date(item.created_at).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (editing) {
    return (
      <Card padding={4}>
        <form onSubmit={onSave} className="grid gap-3">
          {error && <Alert tone="error">{error}</Alert>}
          <Label>
            <span>Título</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              autoFocus
            />
          </Label>
          <Label>
            <span>Contenido</span>
            <TextArea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </Label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setTitle(item.title ?? "");
                setBody(item.body);
                setError(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card padding={4}>
      <div className="grid gap-2">
        <header className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className="m-0 text-base font-semibold text-fg leading-tight">
            {item.title?.trim() || (
              <span className="text-fg-muted italic font-normal">
                (sin título)
              </span>
            )}
          </h3>
          <span className="text-xs text-fg-subtle whitespace-nowrap">
            {dateLabel}
          </span>
        </header>

        <p className="m-0 text-sm text-fg leading-relaxed whitespace-pre-line">
          {item.body}
        </p>

        <footer className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-fg-muted">por {item.owner_email}</span>
          {canModify && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="
                  inline-flex items-center gap-1
                  text-xs font-medium text-fg
                  bg-transparent hover:bg-card-hover
                  border border-border-subtle hover:border-accent
                  rounded-md px-2.5 py-1
                  transition-colors
                  cursor-pointer
                "
              >
                Editar
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="
                  inline-flex items-center gap-1
                  text-xs font-medium text-mic-active
                  bg-transparent hover:bg-mic-active/10
                  border border-border-subtle hover:border-mic-active
                  rounded-md px-2.5 py-1
                  transition-colors
                  cursor-pointer
                "
              >
                Eliminar
              </button>
            </div>
          )}
        </footer>
      </div>
    </Card>
  );
}

// -----------------------------------------------------------------
// Admin: gestión de viewers
// -----------------------------------------------------------------

function ViewersAdminCard() {
  const [viewers, setViewers] = useState<ImprovementViewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listImprovementViewers();
      setViewers(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error cargando viewers";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await addImprovementViewer(email.trim().toLowerCase());
      setEmail("");
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo agregar";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onRemove = async (em: string) => {
    const ok = confirm(`¿Quitar acceso a ${em}?`);
    if (!ok) return;
    try {
      await removeImprovementViewer(em);
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo quitar";
      alert(msg);
    }
  };

  return (
    <Card padding={4}>
      <h2 className="m-0 mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
        Quién puede ver esta sección
        <span className="ml-2 text-fg-subtle font-normal normal-case">
          (solo admins gestionan)
        </span>
      </h2>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <p className="m-0 text-sm text-fg-muted">Cargando…</p>
      ) : viewers.length === 0 ? (
        <p className="m-0 text-sm text-fg-muted">
          Solo los admins ven la sección por ahora. Agregá emails abajo.
        </p>
      ) : (
        <ul className="m-0 p-0 list-none grid gap-2">
          {viewers.map((v) => (
            <li
              key={v.email}
              className="
                flex flex-wrap items-center gap-2
                rounded-lg border border-border-subtle
                bg-page/40 px-3 py-2
              "
            >
              <span className="text-sm text-fg break-all">{v.email}</span>
              {v.added_by_email && (
                <span className="text-xs text-fg-subtle">
                  agregado por {v.added_by_email}
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(v.email)}
                className="
                  ml-auto inline-flex items-center
                  text-xs font-medium text-mic-active
                  bg-transparent hover:bg-mic-active/10
                  border border-border-subtle hover:border-mic-active
                  rounded-md px-2.5 py-1
                  transition-colors
                  cursor-pointer
                "
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onAdd} className="flex flex-wrap items-end gap-2 mt-4">
        <Label className="flex-1 min-w-[200px]">
          <span>Email</span>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="pedro@ejemplo.com"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </Label>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Agregando…" : "Agregar"}
        </Button>
      </form>
      <p className="m-0 mt-2 text-xs text-fg-subtle leading-snug">
        El email tiene que estar también en la lista global de
        <code className="mx-1 text-fg">AUTHORIZED_EMAILS</code>
        para poder iniciar sesión.
      </p>
    </Card>
  );
}

// -----------------------------------------------------------------
// helpers
// -----------------------------------------------------------------

function Alert({
  tone,
  children,
}: {
  tone: "error" | "success" | "warning";
  children: React.ReactNode;
}) {
  const cls =
    tone === "error"
      ? "bg-mic-active/15 text-fg border-mic-active/40"
      : tone === "warning"
      ? "bg-warning-bg text-warning-fg border-black/5"
      : "bg-success/15 text-fg border-success/40";
  return (
    <div
      className={[
        "rounded-lg px-3 py-2 text-sm leading-snug border",
        cls,
      ].join(" ")}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        rounded-xl border border-dashed border-border-subtle
        bg-card/40 px-4 py-6
        text-center text-sm text-fg-muted
      "
    >
      {children}
    </div>
  );
}
