"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // opcional: solo en producción
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[PWA] SW registrado:", reg.scope);
      })
      .catch((err) => {
        console.error("[PWA] Error registrando SW:", err);
      });
  }, []);

  return null;
}
