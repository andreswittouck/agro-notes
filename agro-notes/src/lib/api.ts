import {
  ApiNote,
  CreateNotePayload,
  FarmShare,
  FarmSharesResponse,
  MeResponse,
  Scope,
} from "@/types/note.type";
import type {
  Farm,
  FarmDetail,
  FarmMember,
  FarmMembersResponse,
  FarmRole,
  FarmWithRole,
} from "@/types/farm.type";
import type {
  Improvement,
  ImprovementViewer,
} from "@/types/improvement.type";
import { auth } from "./firebase";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

/**
 * Obtiene un ID token de Firebase. Por default usa el cacheado y deja
 * que el SDK refresque solo si está cerca de expirar. Con
 * `forceRefresh = true` pide uno nuevo al servidor de Firebase
 * inmediatamente — útil tras un 401.
 */
async function getAuthToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch (e) {
    console.warn("[auth] getIdToken falló:", e);
    return null;
  }
}

function buildHeaders(
  token: string | null,
  extra?: HeadersInit
): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...extra,
  };
}

/**
 * fetch con auth automático y reintento ante 401.
 *
 * El ID token de Firebase dura ~1h; cuando vence, el backend devuelve
 * `401 Token inválido o expirado`. Acá interceptamos ese caso, pedimos
 * un token fresco con `getIdToken(true)` y reintentamos UNA vez. Si
 * sigue fallando (refresh token revocado / cuenta deshabilitada),
 * dejamos el 401 para que el caller lo maneje (jsonOrThrow lo convierte
 * en error con mensaje claro, y el guard de la UI redirige a login).
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken(false);
  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(token, options.headers),
  });
  if (res.status !== 401) return res;

  // Reintento con token fresco.
  const fresh = await getAuthToken(true);
  if (!fresh) return res;
  return fetch(url, {
    ...options,
    headers: buildHeaders(fresh, options.headers),
  });
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  let message = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    if (body?.message) message = String(body.message);
  } catch {
    // ignore
  }
  if (res.status === 401) {
    message = "Sesión expirada. Volvé a iniciar sesión.";
  }
  throw new Error(message);
}

// -----------------------------------------------------------------
// Notes
// -----------------------------------------------------------------

export async function createNote(payload: CreateNotePayload) {
  const res = await authenticatedFetch(`${BASE}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<ApiNote>(res);
}

export type ListNotesParams = {
  farm?: string;
  lot?: string;
  /** Solo aplica a admins. `all` = ver TODAS las notas; default `mine`. */
  scope?: Scope;
};

export async function listNotes(params?: ListNotesParams) {
  const url = new URL(`${BASE}/notes`);
  if (params?.farm) url.searchParams.set("farm", params.farm);
  if (params?.lot) url.searchParams.set("lot", params.lot);
  if (params?.scope) url.searchParams.set("scope", params.scope);

  const res = await authenticatedFetch(url.toString(), { cache: "no-store" });
  return jsonOrThrow<ApiNote[]>(res);
}

export async function listNoteChanges(
  since: string,
  params?: ListNotesParams
) {
  const url = new URL(`${BASE}/notes/changes`);
  url.searchParams.set("since", since);
  if (params?.farm) url.searchParams.set("farm", params.farm);
  if (params?.lot) url.searchParams.set("lot", params.lot);
  if (params?.scope) url.searchParams.set("scope", params.scope);

  const res = await authenticatedFetch(url.toString(), { cache: "no-store" });
  return jsonOrThrow<ApiNote[]>(res);
}

export type UpdateNotePayload = Partial<
  Omit<CreateNotePayload, "id" | "created_at">
>;

export async function updateNote(
  id: string,
  payload: UpdateNotePayload
): Promise<ApiNote> {
  const res = await authenticatedFetch(`${BASE}/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<ApiNote>(res);
}

export async function deleteNote(id: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/notes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

// -----------------------------------------------------------------
// Me / sharing
// -----------------------------------------------------------------

export async function getMe(): Promise<MeResponse> {
  const res = await authenticatedFetch(`${BASE}/me`, { cache: "no-store" });
  return jsonOrThrow<MeResponse>(res);
}

export async function listFarmShares(): Promise<FarmSharesResponse> {
  const res = await authenticatedFetch(`${BASE}/shares/farms`, {
    cache: "no-store",
  });
  return jsonOrThrow<FarmSharesResponse>(res);
}

export async function createFarmShare(payload: {
  farm: string;
  shared_with_email: string;
}): Promise<FarmShare> {
  const res = await authenticatedFetch(`${BASE}/shares/farms`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<FarmShare>(res);
}

export async function deleteFarmShare(
  ownerEmail: string,
  farm: string,
  sharedWithEmail: string
): Promise<void> {
  const url =
    `${BASE}/shares/farms/` +
    encodeURIComponent(ownerEmail) +
    `/` +
    encodeURIComponent(farm) +
    `/` +
    encodeURIComponent(sharedWithEmail);
  const res = await authenticatedFetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

// -----------------------------------------------------------------
// Farms (CRUD + miembros)
// -----------------------------------------------------------------

export async function listFarms(): Promise<FarmWithRole[]> {
  const res = await authenticatedFetch(`${BASE}/farms`, { cache: "no-store" });
  return jsonOrThrow<FarmWithRole[]>(res);
}

export async function createFarm(payload: {
  name: string;
  description?: string;
}): Promise<Farm> {
  const res = await authenticatedFetch(`${BASE}/farms`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<Farm>(res);
}

export async function getFarm(id: string): Promise<FarmDetail> {
  const res = await authenticatedFetch(`${BASE}/farms/${id}`, {
    cache: "no-store",
  });
  return jsonOrThrow<FarmDetail>(res);
}

export async function updateFarm(
  id: string,
  payload: { name?: string; description?: string }
): Promise<Farm> {
  const res = await authenticatedFetch(`${BASE}/farms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<Farm>(res);
}

export async function deleteFarm(id: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/farms/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

export async function listFarmMembers(id: string): Promise<FarmMembersResponse> {
  const res = await authenticatedFetch(`${BASE}/farms/${id}/members`, {
    cache: "no-store",
  });
  return jsonOrThrow<FarmMembersResponse>(res);
}

export async function upsertFarmMember(
  id: string,
  payload: { email: string; role: FarmRole }
): Promise<FarmMember> {
  const res = await authenticatedFetch(`${BASE}/farms/${id}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<FarmMember>(res);
}

export async function removeFarmMember(
  id: string,
  email: string
): Promise<void> {
  const url = `${BASE}/farms/${id}/members/${encodeURIComponent(email)}`;
  const res = await authenticatedFetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

// -----------------------------------------------------------------
// Improvements (panel compartido para emails habilitados por admin)
// -----------------------------------------------------------------

export async function listImprovements(): Promise<Improvement[]> {
  const res = await authenticatedFetch(`${BASE}/improvements`, {
    cache: "no-store",
  });
  return jsonOrThrow<Improvement[]>(res);
}

export async function createImprovement(payload: {
  title?: string;
  body: string;
}): Promise<Improvement> {
  const res = await authenticatedFetch(`${BASE}/improvements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<Improvement>(res);
}

export async function updateImprovement(
  id: string,
  payload: { title?: string; body?: string }
): Promise<Improvement> {
  const res = await authenticatedFetch(`${BASE}/improvements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<Improvement>(res);
}

export async function deleteImprovement(id: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/improvements/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

export async function listImprovementViewers(): Promise<ImprovementViewer[]> {
  const res = await authenticatedFetch(
    `${BASE}/improvements/viewers/list`,
    { cache: "no-store" }
  );
  return jsonOrThrow<ImprovementViewer[]>(res);
}

export async function addImprovementViewer(
  email: string
): Promise<ImprovementViewer> {
  const res = await authenticatedFetch(`${BASE}/improvements/viewers`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return jsonOrThrow<ImprovementViewer>(res);
}

export async function removeImprovementViewer(email: string): Promise<void> {
  const url = `${BASE}/improvements/viewers/${encodeURIComponent(email)}`;
  const res = await authenticatedFetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}
