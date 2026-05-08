"use client";

import { useMe } from "@/contexts/MeContext";

/**
 * Toggle "Mías / Todas" del scope de admin.
 * Solo se renderiza si el usuario actual es admin (`me.isAdmin`).
 */
export function AdminScopeToggle() {
  const { me, scope, setScope } = useMe();
  if (!me?.isAdmin) return null;

  return (
    <div
      role="group"
      aria-label="Alcance de notas (admin)"
      className="
        inline-flex items-center
        rounded-full border border-border-subtle
        bg-page/60 backdrop-blur
        p-0.5
        text-xs
      "
    >
      <ToggleButton
        active={scope === "mine"}
        onClick={() => setScope("mine")}
        label="Mías"
        title="Mostrar solo mis notas"
      />
      <ToggleButton
        active={scope === "all"}
        onClick={() => setScope("all")}
        label="Todas"
        title="Mostrar todas las notas del sistema (admin)"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={[
        "px-2.5 py-1 rounded-full font-medium",
        "transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "bg-accent text-fg shadow-sm"
          : "text-fg-muted hover:text-fg",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
