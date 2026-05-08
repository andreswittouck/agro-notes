"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useMe } from "@/contexts/MeContext";
import { AdminScopeToggle } from "./AdminScopeToggle";

/**
 * Botón de menú (☰) con un panel desplegable que lista todas las
 * secciones. Centraliza la navegación así no llenamos el header de
 * botones, y libera espacio en mobile.
 *
 * En desktop se ve como un dropdown. En mobile como un drawer
 * (parte derecha de la pantalla, con backdrop).
 */
export function AppMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const { signOut } = useAuth();
  const { me } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  // Cerrar el menú al cambiar de ruta.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Cerrar al click fuera o tecla Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/login");
  };

  const links: { href: string; label: string; icon: React.ReactNode }[] = [
    { href: "/", label: "Inicio", icon: <HomeIcon /> },
    { href: "/notes", label: "Notas", icon: <NotesIcon /> },
    { href: "/voice-note", label: "Nueva por voz", icon: <MicIcon /> },
    { href: "/farms", label: "Explotaciones", icon: <FarmIcon /> },
  ];
  if (me?.canViewImprovements) {
    links.push({
      href: "/improvements",
      label: "Mejoras",
      icon: <BulbIcon />,
    });
  }
  links.push({ href: "/profile", label: "Mi perfil", icon: <UserIcon /> });

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-haspopup="menu"
        className="
          inline-flex items-center justify-center
          w-9 h-9 rounded-md
          text-fg-muted hover:text-fg
          bg-transparent hover:bg-card-hover
          border border-border-subtle hover:border-border-strong
          transition-colors
          cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
        "
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Backdrop solo en mobile para que el drawer se sienta modal */}
      {open && (
        <div
          aria-hidden="true"
          className="sm:hidden fixed inset-0 bg-page/60 z-40"
        />
      )}

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Menú"
          className="
            fixed sm:absolute
            z-50
            top-[3.75rem] sm:top-[calc(100%+0.5rem)]
            right-3 sm:right-0
            w-[min(20rem,calc(100vw-1.5rem))]
            bg-card border border-border-subtle
            rounded-xl shadow-lg
            p-2
            animate-fade-in-up
          "
        >
          <nav className="grid">
            {links.map((l) => (
              <MenuLink
                key={l.href}
                href={l.href}
                icon={l.icon}
                label={l.label}
                active={pathname === l.href}
                onClick={() => setOpen(false)}
              />
            ))}

            {/* AdminScopeToggle solo en mobile (en desktop está en el
                header). Para no duplicar visualmente, lo escondemos en
                pantallas anchas. */}
            {me?.isAdmin && (
              <div className="sm:hidden mt-2 px-2 py-2 border-t border-border-subtle flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wide text-fg-muted">
                  Alcance
                </span>
                <AdminScopeToggle />
              </div>
            )}

            <div className="mt-1 pt-1 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleSignOut}
                className="
                  w-full flex items-center gap-2
                  px-2 py-2 rounded-md
                  text-sm font-medium
                  text-mic-active hover:text-mic-active
                  hover:bg-mic-active/10
                  transition-colors
                  cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-mic-active
                "
              >
                <SignOutIcon />
                Salir
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "flex items-center gap-2 px-2 py-2 rounded-md",
        "text-sm font-medium",
        "transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "bg-accent/15 text-accent"
          : "text-fg hover:bg-card-hover",
      ].join(" ")}
      role="menuitem"
    >
      <span className={active ? "text-accent" : "text-fg-muted"}>{icon}</span>
      {label}
    </Link>
  );
}

// ---------------- Icons ----------------

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12L12 3l9 9" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}

function FarmIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.7.7 1 1.4 1 2.3v1h6v-1c0-.9.3-1.6 1-2.3A7 7 0 0 0 12 2Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
