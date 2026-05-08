"use client";

import type { EffectiveRole } from "@/types/farm.type";

/**
 * Badge para mostrar el rol del usuario actual respecto a una farm.
 * Tres tonos:
 *  - Dueño  → accent (azul)
 *  - Editor → success (verde)
 *  - Lector → neutro
 */
export function RoleBadge({ role }: { role: EffectiveRole }) {
  const label =
    role === "owner" ? "Dueño" : role === "editor" ? "Editor" : "Lector";
  const styles =
    role === "owner"
      ? "bg-accent/15 text-accent border-accent/30"
      : role === "editor"
      ? "bg-success/15 text-success border-success/30"
      : "bg-page/60 text-fg-muted border-border-subtle";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5",
        "text-xs px-2 py-0.5 rounded-full border font-medium",
        styles,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
