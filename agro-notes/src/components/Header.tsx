// agro-notes/src/components/Header.tsx
"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { SyncBadge } from "./SyncBadge";
import { AdminScopeToggle } from "./AdminScopeToggle";
import { AppMenu } from "./AppMenu";

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();

  // No mostrar header en login
  if (pathname === "/login") {
    return null;
  }

  return (
    <header
      className="
        sticky top-0 z-40
        bg-card/90 backdrop-blur
        border-b border-border-subtle
      "
    >
      <div
        className="
          mx-auto w-full max-w-[980px]
          flex items-center justify-between gap-3
          px-4 py-3
          sm:px-6
        "
      >
        <a
          href="/"
          className="flex items-center gap-2 group"
          aria-label="Ir al inicio"
        >
          <Image
            src="/icons/agro-notes-logo.svg"
            alt="Agro Notes logo"
            width={36}
            height={36}
            className="rounded-md object-contain transition-transform group-hover:scale-105"
          />
          <h1 className="m-0 text-base sm:text-lg font-semibold tracking-tight">
            Agro Notes
          </h1>
        </a>

        {user && (
          <div className="flex items-center gap-2">
            {/* AdminScopeToggle solo en pantallas medianas+; en mobile
                se muestra dentro del AppMenu para no saturar el header. */}
            <div className="hidden sm:block">
              <AdminScopeToggle />
            </div>
            <SyncBadge />
            <AppMenu />
          </div>
        )}
      </div>
    </header>
  );
}
