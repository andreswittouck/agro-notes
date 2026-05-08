// agro-notes/src/app/farms/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { PageContainer } from "@/components/ui/PageContainer";
import { AuthGuard } from "@/components/AuthGuard";
import { BackButton } from "@/components/ui/BackButton";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

import { createFarm, listFarms } from "@/lib/api";
import type { FarmWithRole } from "@/types/farm.type";
import { RoleBadge } from "@/components/farms/RoleBadge";

export default function FarmsPage() {
  return (
    <AuthGuard>
      <FarmsPageInner />
    </AuthGuard>
  );
}

function FarmsPageInner() {
  const [farms, setFarms] = useState<FarmWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFarms();
      setFarms(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error cargando explotaciones";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    setSubmitting(true);
    try {
      await createFarm({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      setShowForm(false);
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const owned = farms.filter((f) => f.my_role === "owner");
  const shared = farms.filter((f) => f.my_role !== "owner");

  return (
    <PageContainer maxWidth="720px">
      <BackButton href="/" label="Volver" />

      <header className="grid gap-1">
        <h1 className="m-0 text-xl font-semibold tracking-tight text-fg">
          Explotaciones
        </h1>
        <p className="m-0 text-sm text-fg-muted leading-snug">
          Cada explotación agrupa notas y miembros. Compartiéndolas, otros
          usuarios pueden leer o editar las notas según el rol.
        </p>
      </header>

      {error && <Alert tone="error">{error}</Alert>}

      {/* ----------- Crear ----------- */}
      <Card padding={4}>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="
              inline-flex items-center gap-2
              text-sm font-medium text-fg
              bg-accent hover:bg-accent-hover
              rounded-lg px-3 py-2
              transition-colors
              cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card
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
            Nueva explotación
          </button>
        ) : (
          <form onSubmit={onCreate} className="grid gap-3">
            <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-fg-muted">
              Nueva explotación
            </h2>

            {formError && <Alert tone="error">{formError}</Alert>}

            <Label>
              <span>Nombre</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Carlos"
                autoComplete="off"
                autoCapitalize="words"
                autoFocus
              />
            </Label>
            <Label>
              <span>Descripción (opcional)</span>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notas internas, ubicación, etc."
                rows={2}
              />
            </Label>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setName("");
                  setDescription("");
                  setFormError(null);
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Creando…" : "Crear"}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* ----------- Mis explotaciones ----------- */}
      <section className="grid gap-3">
        <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-fg-muted">
          Mis explotaciones
          {owned.length > 0 && (
            <span className="ml-2 text-fg-subtle">· {owned.length}</span>
          )}
        </h2>
        {loading ? (
          <p className="m-0 text-sm text-fg-muted">Cargando…</p>
        ) : owned.length === 0 ? (
          <EmptyHint>
            Todavía no creaste ninguna. Usá "Nueva explotación" arriba.
          </EmptyHint>
        ) : (
          owned.map((f) => <FarmRow key={f.id} farm={f} />)
        )}
      </section>

      {/* ----------- Compartidas ----------- */}
      {(loading ? false : shared.length > 0) && (
        <section className="grid gap-3">
          <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Compartidas conmigo
            <span className="ml-2 text-fg-subtle">· {shared.length}</span>
          </h2>
          {shared.map((f) => (
            <FarmRow key={f.id} farm={f} />
          ))}
        </section>
      )}
    </PageContainer>
  );
}

function FarmRow({ farm }: { farm: FarmWithRole }) {
  return (
    <Link
      href={`/farms/${farm.id}`}
      className="
        block
        rounded-xl border border-border-subtle
        bg-card hover:bg-card-hover
        px-4 py-3
        transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-semibold text-fg leading-tight">
            {farm.name}
          </h3>
          {farm.description && (
            <p className="m-0 mt-1 text-sm text-fg-muted leading-snug line-clamp-2">
              {farm.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <RoleBadge role={farm.my_role} />
            <span className="text-fg-subtle">
              {farm.member_count === 0
                ? "Solo el dueño"
                : `${farm.member_count} ${
                    farm.member_count === 1 ? "miembro" : "miembros"
                  }`}
            </span>
          </div>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-fg-muted mt-1"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  const cls =
    tone === "error"
      ? "bg-mic-active/15 text-fg border-mic-active/40"
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
