import { ApiNote, CreateNotePayload } from "@/types/note.type";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export async function createNote(payload: CreateNotePayload) {
  const res = await fetch(`${BASE}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return (await res.json()) as ApiNote;
}

export async function listNotes(params?: { farm?: string; lot?: string }) {
  const url = new URL(`${BASE}/notes`);
  if (params?.farm) url.searchParams.set("farm", params.farm);
  if (params?.lot) url.searchParams.set("lot", params.lot);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Error fetching notes");
  return (await res.json()) as ApiNote[];
}

// para el sync:
export async function listNoteChanges(
  since: string,
  params?: { farm?: string; lot?: string }
) {
  const url = new URL(`${BASE}/notes/changes`);
  url.searchParams.set("since", since);
  if (params?.farm) url.searchParams.set("farm", params.farm);
  if (params?.lot) url.searchParams.set("lot", params.lot);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Error fetching note changes");
  return (await res.json()) as ApiNote[];
}

export type UpdateNotePayload = Partial<
  Omit<CreateNotePayload, "id" | "created_at">
>;

export async function updateNote(
  id: string,
  payload: UpdateNotePayload
): Promise<ApiNote> {
  const res = await fetch(`${BASE}/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return (await res.json()) as ApiNote;
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${BASE}/notes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}
