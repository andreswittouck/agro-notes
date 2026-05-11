"use client";

import { useSyncStatus } from "@/hooks/useSyncStatus";

/**
 * Badge de sincronización para el header.
 *
 * Estados visuales:
 *  - offline       → pill rojo "Offline"
 *  - syncing       → pill azul con spinner "Sincronizando…"
 *  - error > 0     → pill rojo "N error(es) — reintentar"
 *  - pending > 0   → pill amarillo "N pendiente(s)" (click → triggerSync)
 *  - ok            → dot verde discreto (click → triggerSync)
 *
 * El click sobre el badge fuerza un sync manual cuando está online y
 * no hay otro en curso.
 */
export function SyncBadge() {
  const {
    online,
    syncing,
    pendingCount,
    errorCount,
    lastSyncAt,
    triggerSync,
  } = useSyncStatus();

  const tooltip = lastSyncAt
    ? `Última sincronización: ${lastSyncAt.toLocaleString("es-AR")}`
    : "Sin sincronizar todavía";

  const handleClick = () => {
    if (!online || syncing) return;
    void triggerSync();
  };

  // ---- offline ----
  if (!online) {
    return (
      <Pill tone="danger" title={tooltip} disabled>
        <Dot tone="danger" />
        Offline
      </Pill>
    );
  }

  // ---- syncing ----
  if (syncing) {
    return (
      <Pill tone="accent" title={tooltip} disabled>
        <Spinner />
        Sincronizando…
      </Pill>
    );
  }

  // ---- error ----
  if (errorCount > 0) {
    return (
      <Pill
        tone="danger"
        title={`${tooltip} — click para reintentar`}
        onClick={handleClick}
      >
        <Dot tone="danger" />
        {errorCount} con error
      </Pill>
    );
  }

  // ---- pending ----
  if (pendingCount > 0) {
    return (
      <Pill
        tone="warning"
        title={`${tooltip} — click para sincronizar ahora`}
        onClick={handleClick}
      >
        <Dot tone="warning" />
        {pendingCount} pendiente{pendingCount === 1 ? "" : "s"}
      </Pill>
    );
  }

  // ---- ok (todo sincronizado) ----
  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${tooltip} — click para sincronizar ahora`}
      aria-label="Sincronizado. Click para sincronizar ahora."
      className="
        inline-flex items-center justify-center
        w-7 h-7 rounded-full
        bg-transparent hover:bg-card-hover
        transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
        cursor-pointer
      "
    >
      <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
    </button>
  );
}

// ---------- helpers ----------

type PillTone = "accent" | "warning" | "danger";

function Pill({
  children,
  tone,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  tone: PillTone;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles: Record<PillTone, string> = {
    accent: "bg-accent/15 text-accent border-accent/30",
    warning: "bg-warning-bg text-warning-fg border-warning-fg/30",
    danger: "bg-mic-active/15 text-mic-active border-mic-active/40",
  };

  const interactive = !disabled && !!onClick;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "inline-flex items-center gap-1.5",
        "rounded-full px-2.5 py-1",
        "text-xs font-medium border",
        "transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        styles[tone],
        interactive
          ? "cursor-pointer hover:brightness-110"
          : "cursor-default",
        "disabled:opacity-90",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Dot({ tone }: { tone: PillTone }) {
  const styles: Record<PillTone, string> = {
    accent: "bg-accent",
    warning: "bg-warning-fg",
    danger: "bg-mic-active",
  };
  return (
    <span
      aria-hidden="true"
      className={["w-1.5 h-1.5 rounded-full", styles[tone]].join(" ")}
    />
  );
}

function Spinner() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
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
