// agro-notes/src/lib/firebase.ts
"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Inicialización lazy del SDK de Firebase Client.
 *
 * En el build de Next.js cada page client se prerendera en Node. Si
 * `getAuth()` se ejecuta en ese contexto SIN tener las env vars
 * (porque Vercel las inyecta solo en runtime) tira
 * `FirebaseError: Need to provide options`. Para evitar eso, todo el
 * setup vive detrás de funciones que solo corren cuando alguien
 * realmente las usa (en el navegador, dentro de un useEffect).
 */
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getOrCreateApp(): FirebaseApp {
  if (_app) return _app;
  const existing = getApps();
  _app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  return _app;
}

function getOrCreateAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getOrCreateApp());
  return _auth;
}

/**
 * Proxy al objeto `Auth` que difiere la creación hasta el primer acceso.
 * La API queda igual que antes: `auth.currentUser`, `auth.signOut()`, etc.
 */
export const auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    return Reflect.get(getOrCreateAuth(), prop, receiver);
  },
  set(_target, prop, value) {
    return Reflect.set(getOrCreateAuth(), prop, value);
  },
}) as Auth;

export default new Proxy({} as FirebaseApp, {
  get(_target, prop, receiver) {
    return Reflect.get(getOrCreateApp(), prop, receiver);
  },
}) as FirebaseApp;
