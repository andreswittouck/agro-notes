// agro-notes/src/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "../components/ui/PageContainer";
import { Card } from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { useMe } from "../contexts/MeContext";

export default function Home() {
  const { user, loading } = useAuth();
  const { me } = useMe();
  const router = useRouter();

  // Si no está autenticado, redirigir a login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <PageContainer maxWidth="540px">
      <header className="grid gap-1">
        <h1 className="m-0 text-xl font-semibold tracking-tight">
          Agro Notes
        </h1>
        <p className="m-0 text-sm text-fg-muted leading-snug">
          Notas rápidas de lote, malezas y aplicaciones. Funciona offline.
        </p>
      </header>

      <Card padding={3}>
        <nav className="grid">
          <HomeLink
            href="/voice-note"
            label="Nueva nota por voz"
            description="Mantené apretado y dictá los datos."
            icon={
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
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            }
          />
          <HomeLink
            href="/notes"
            label="Ver notas"
            description="Listado, filtros y edición."
            icon={
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
            }
          />
          <HomeLink
            href="/farms"
            label="Explotaciones"
            description="Crear, editar y compartir explotaciones con otros usuarios."
            icon={
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
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 21V12h6v9" />
              </svg>
            }
          />
          {me?.canViewImprovements && (
            <HomeLink
              href="/improvements"
              label="Mejoras"
              description="Buzón de ideas para evolucionar la app."
              icon={
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
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7c.7.7 1 1.4 1 2.3v1h6v-1c0-.9.3-1.6 1-2.3A7 7 0 0 0 12 2Z" />
                </svg>
              }
            />
          )}
          <HomeLink
            href="/profile"
            label="Mi perfil"
            description="Cuenta y preferencias."
            icon={
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            last
          />
        </nav>
      </Card>
    </PageContainer>
  );
}

function HomeLink({
  href,
  label,
  description,
  icon,
  last,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3",
        "px-1 py-3",
        "text-fg",
        "hover:bg-card-hover/40",
        "rounded-md",
        "transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        last ? "" : "border-b border-border-subtle",
      ].join(" ")}
    >
      <span className="shrink-0 text-accent">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-fg-muted">{description}</span>
      </span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-fg-muted"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
