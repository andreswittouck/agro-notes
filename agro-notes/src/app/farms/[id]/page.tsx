// agro-notes/src/app/farms/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PageContainer } from "@/components/ui/PageContainer";
import { AuthGuard } from "@/components/AuthGuard";
import { BackButton } from "@/components/ui/BackButton";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

import {
  deleteFarm,
  getFarm,
  listFarmMembers,
  removeFarmMember,
  updateFarm,
  upsertFarmMember,
} from "@/lib/api";
import type {
  EffectiveRole,
  FarmDetail,
  FarmMember,
  FarmRole,
  FarmMembersResponse,
} from "@/types/farm.type";
import { useMe } from "@/contexts/MeContext";
import { RoleBadge } from "@/components/farms/RoleBadge";

export default function FarmDetailPage() {
  return (
    <AuthGuard>
      <FarmDetailInner />
    </AuthGuard>
  );
}

function FarmDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const { me } = useMe();

  const [detail, setDetail] = useState<FarmDetail | null>(null);
  const [membersData, setMembersData] = useState<FarmMembersResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [d, m] = await Promise.all([getFarm(id), listFarmMembers(id)]);
      setDetail(d);
      setMembersData(m);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Error cargando la explotación";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading && !detail) {
    return (
      <PageContainer maxWidth="720px">
        <BackButton href="/farms" label="Volver" />
        <Card padding={4}>
          <p className="m-0 text-fg-muted text-sm">Cargando…</p>
        </Card>
      </PageContainer>
    );
  }

  if (error && !detail) {
    return (
      <PageContainer maxWidth="720px">
        <BackButton href="/farms" label="Volver" />
        <Alert tone="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!detail) return null;

  const { farm, my_role } = detail;
  const isOwner = my_role === "owner";
  const isEditor = my_role === "editor";
  const isAdmin = me?.isAdmin === true;

  const canEditMeta = isOwner || isEditor || isAdmin;
  const canManageMembers = isOwner || isEditor || isAdmin;
  const canDelete = isOwner || isAdmin;

  const onDelete = async () => {
    const ok = confirm(
      `¿Eliminar la explotación "${farm.name}"? ` +
        `Las notas existentes no se borran.`
    );
    if (!ok) return;
    try {
      await deleteFarm(farm.id);
      router.push("/farms");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar";
      alert(msg);
    }
  };

  return (
    <PageContainer maxWidth="720px">
      <BackButton href="/farms" label="Volver a explotaciones" />

      <header className="grid gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="m-0 text-xl font-semibold tracking-tight text-fg">
            {farm.name}
          </h1>
          <RoleBadge role={my_role as EffectiveRole} />
        </div>
        <p className="m-0 text-xs text-fg-subtle">
          Dueño: {farm.owner_email}
        </p>
      </header>

      {/* ----------- Datos de la farm ----------- */}
      <FarmMetaCard
        farm={farm}
        canEdit={canEditMeta}
        onSaved={reload}
      />

      {/* ----------- Miembros ----------- */}
      <MembersCard
        ownerEmail={membersData?.owner_email ?? farm.owner_email}
        members={membersData?.members ?? []}
        farmId={farm.id}
        canManage={canManageMembers}
        onChanged={reload}
        meEmail={(me?.email ?? "").toLowerCase()}
      />

      {/* ----------- Borrar ----------- */}
      {canDelete && (
        <Card padding={4}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="grid gap-0.5">
              <strong className="text-sm text-fg">Eliminar explotación</strong>
              <span className="text-xs text-fg-muted">
                Las notas con ese nombre quedan como notas personales del dueño.
              </span>
            </div>
            <Button onClick={onDelete} variant="danger" size="sm">
              Eliminar
            </Button>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

// -----------------------------------------------------------------
// Edit metadata
// -----------------------------------------------------------------

function FarmMetaCard({
  farm,
  canEdit,
  onSaved,
}: {
  farm: FarmDetail["farm"];
  canEdit: boolean;
  onSaved: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(farm.name);
  const [description, setDescription] = useState(farm.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(farm.name);
    setDescription(farm.description ?? "");
  }, [farm]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      await updateFarm(farm.id, {
        name: name.trim(),
        description: description.trim(),
      });
      setEditing(false);
      await onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding={4}>
      {!editing ? (
        <div className="grid gap-2">
          <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Datos
          </h2>
          <div>
            <span className="text-fg-muted text-xs uppercase tracking-wide mr-1.5">
              Nombre:
            </span>
            <span className="text-fg">{farm.name}</span>
          </div>
          <div>
            <span className="text-fg-muted text-xs uppercase tracking-wide mr-1.5">
              Descripción:
            </span>
            <span className="text-fg whitespace-pre-line">
              {farm.description?.trim() || "—"}
            </span>
          </div>
          {canEdit && (
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Editar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3">
          <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Editar datos
          </h2>
          {error && <Alert tone="error">{error}</Alert>}
          <Label>
            <span>Nombre</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Label>
          <Label>
            <span>Descripción</span>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(farm.name);
                setDescription(farm.description ?? "");
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
      )}
    </Card>
  );
}

// -----------------------------------------------------------------
// Members
// -----------------------------------------------------------------

function MembersCard({
  ownerEmail,
  members,
  farmId,
  canManage,
  onChanged,
  meEmail,
}: {
  ownerEmail: string;
  members: FarmMember[];
  farmId: string;
  canManage: boolean;
  onChanged: () => void | Promise<void>;
  meEmail: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<FarmRole>("reader");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Ingresá un email.");
      return;
    }
    setSubmitting(true);
    try {
      await upsertFarmMember(farmId, {
        email: email.trim().toLowerCase(),
        role,
      });
      setEmail("");
      setRole("reader");
      await onChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo invitar";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeRole = async (m: FarmMember, next: FarmRole) => {
    if (m.role === next) return;
    try {
      await upsertFarmMember(farmId, { email: m.email, role: next });
      await onChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo cambiar el rol";
      alert(msg);
    }
  };

  const onRemove = async (m: FarmMember) => {
    const ok = confirm(`¿Quitar a ${m.email}?`);
    if (!ok) return;
    try {
      await removeFarmMember(farmId, m.email);
      await onChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo quitar";
      alert(msg);
    }
  };

  return (
    <Card padding={4}>
      <h2 className="m-0 mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
        Miembros
      </h2>

      <ul className="m-0 p-0 list-none grid gap-2">
        {/* Owner siempre presente, primero */}
        <li
          className="
            flex flex-wrap items-center gap-2
            rounded-lg border border-border-subtle
            bg-page/40 px-3 py-2
          "
        >
          <span className="text-sm text-fg break-all">{ownerEmail}</span>
          <RoleBadge role="owner" />
        </li>

        {members.map((m) => (
          <li
            key={`${m.farm_id}-${m.email}`}
            className="
              flex flex-wrap items-center gap-2
              rounded-lg border border-border-subtle
              bg-page/40 px-3 py-2
            "
          >
            <span className="text-sm text-fg break-all">{m.email}</span>
            {canManage ? (
              <div className="flex items-center gap-1.5 ml-auto">
                <RoleSelector
                  value={m.role}
                  onChange={(r) => onChangeRole(m, r)}
                />
                <button
                  type="button"
                  onClick={() => onRemove(m)}
                  className="
                    inline-flex items-center
                    text-xs font-medium text-mic-active
                    bg-transparent hover:bg-mic-active/10
                    border border-border-subtle hover:border-mic-active
                    rounded-md px-2.5 py-1
                    transition-colors
                    cursor-pointer
                  "
                  title="Quitar"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <span className="ml-auto">
                <RoleBadge role={m.role} />
              </span>
            )}
          </li>
        ))}

        {/* Auto-quitarme: si NO puedo gestionar pero soy member, mostrar
            botón de salirme. */}
        {!canManage &&
          members.some((m) => m.email === meEmail) && (
            <li className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onRemove(
                    members.find((m) => m.email === meEmail) as FarmMember
                  )
                }
                className="
                  inline-flex items-center
                  text-xs font-medium text-fg-muted hover:text-fg
                  bg-transparent hover:bg-card-hover
                  border border-border-subtle hover:border-border-strong
                  rounded-md px-2.5 py-1
                "
              >
                Salirme de esta explotación
              </button>
            </li>
          )}
      </ul>

      {canManage && (
        <form onSubmit={onAdd} className="grid gap-2 mt-4">
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex flex-wrap items-end gap-2">
            <Label className="flex-1 min-w-[200px]">
              <span>Invitar email</span>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pedro@ejemplo.com"
                type="email"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
              />
            </Label>
            <Label className="min-w-[120px]">
              <span>Rol</span>
              <RoleSelector value={role} onChange={setRole} />
            </Label>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Agregando…" : "Agregar"}
            </Button>
          </div>
          <p className="m-0 text-xs text-fg-subtle leading-snug">
            El invitado tiene que estar en la lista de usuarios autorizados de
            la app (la administra el admin de Agro Notes).
          </p>
        </form>
      )}
    </Card>
  );
}

function RoleSelector({
  value,
  onChange,
}: {
  value: FarmRole;
  onChange: (r: FarmRole) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FarmRole)}
      className="
        bg-page text-fg
        border border-border-subtle hover:border-border-strong
        rounded-lg px-2 py-1.5 text-sm
        focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/40
        cursor-pointer
      "
    >
      <option value="reader">Lector</option>
      <option value="editor">Editor</option>
    </select>
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
