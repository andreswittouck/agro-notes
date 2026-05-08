/**
 * Modelo de nota tal cual lo serializa la API (`agro-notes-api`).
 */
export type ApiNote = {
  id: string;
  /** Email del dueño (lo asigna el backend desde el JWT). */
  owner_email: string;
  /** Si es true, no se comparte aunque la explotación tenga shares. */
  is_private: boolean;
  farm: string;
  lot: string;
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
};

/**
 * Modelo de nota en IndexedDB (Dexie). Igual al de la API más metadata
 * de sincronización.
 */
export type LocalNote = ApiNote & {
  syncStatus: "synced" | "pending" | "error";
  operation?: "create" | "update" | "delete";
};

/**
 * Payload para crear una nota desde el cliente.
 * `owner_email` no se manda: lo asigna el backend (o, en optimistic
 * local, lo sabemos del usuario logueado y lo escribimos directo en
 * IndexedDB para que la UI lo muestre antes de sincronizar).
 */
export type CreateNotePayload = {
  id?: string;
  farm: string;
  lot: string;
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
  is_private?: boolean;
  created_at?: string;
};

/**
 * Scope de visualización (solo lo respeta el backend si el caller es admin).
 */
export type Scope = "mine" | "all";

/**
 * Respuesta de `GET /me`.
 */
export type MeResponse = {
  uid: string;
  email: string;
  emailVerified?: boolean;
  isAdmin: boolean;
  /** Si el usuario está autorizado para ver la sección "Mejoras". */
  canViewImprovements: boolean;
};

/**
 * Acceso a una explotación. El owner ve su lista en `granted` (lo que
 * compartió) y los receptores la ven en `received`.
 */
export type FarmShare = {
  owner_email: string;
  farm: string;
  shared_with_email: string;
  created_at: string;
};

export type FarmSharesResponse = {
  granted: FarmShare[];
  received: FarmShare[];
};
