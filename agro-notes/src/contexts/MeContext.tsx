// agro-notes/src/contexts/MeContext.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { MeResponse, Scope } from "@/types/note.type";
import { getMe } from "@/lib/api";
import { useAuth } from "./AuthContext";

const SCOPE_KEY = "agro-notes:scope";

type MeContextValue = {
  /** Resultado de GET /me (null hasta que termina la primera carga). */
  me: MeResponse | null;
  /** True mientras se carga /me por primera vez. */
  loading: boolean;
  /** Scope efectivo: "all" solo si el caller es admin Y eligió "all". */
  scope: Scope;
  /**
   * Cambiar el scope. Si el usuario no es admin, ignora "all" y se
   * queda en "mine".
   */
  setScope: (s: Scope) => void;
  /** Re-fetch manual de /me (después de algún cambio de auth). */
  refresh: () => Promise<void>;
};

const MeContext = createContext<MeContextValue | undefined>(undefined);

function readStoredScope(): Scope {
  if (typeof window === "undefined") return "mine";
  const v = window.localStorage.getItem(SCOPE_KEY);
  return v === "all" ? "all" : "mine";
}

function writeStoredScope(s: Scope) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SCOPE_KEY, s);
}

export function MeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [storedScope, setStoredScope] = useState<Scope>(() => readStoredScope());

  const refresh = useCallback(async () => {
    if (!user) {
      setMe(null);
      return;
    }
    setLoading(true);
    try {
      // Forzamos refresh del ID token antes del primer GET /me. Esto
      // evita que se use un token cacheado del intento de login previo
      // (típico tras `signInWithPopup` o cuando hubo un 401 reciente).
      try {
        await user.getIdToken(true);
      } catch {
        /* getIdToken puede fallar si el refresh token venció — dejamos
         * pasar; el siguiente fetch va a manejar el 401. */
      }
      const data = await getMe();
      setMe(data);
    } catch (e) {
      console.error("Error fetching /me:", e);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cuando hay un usuario logueado (y firebase terminó de cargar),
  // pedimos /me. Si el usuario hace logout, limpiamos.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setMe(null);
      return;
    }
    void refresh();
  }, [user, authLoading, refresh]);

  // Si dejaste de ser admin (o nunca lo fuiste) y tenías scope=all
  // guardado, lo bajamos a "mine" para no enviar requests con un scope
  // que el backend no respeta.
  const effectiveScope: Scope = me?.isAdmin ? storedScope : "mine";

  const setScope = useCallback((s: Scope) => {
    setStoredScope(s);
    writeStoredScope(s);
  }, []);

  const value: MeContextValue = {
    me,
    loading,
    scope: effectiveScope,
    setScope,
    refresh,
  };

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe(): MeContextValue {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error("useMe must be used within a MeProvider");
  return ctx;
}
