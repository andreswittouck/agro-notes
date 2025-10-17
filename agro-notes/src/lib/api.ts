const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export type Note = {
  id: string;
  farm: string;
  lot: string;
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
  created_at: string;
};

export async function createNote(payload: Omit<Note, "id" | "createdAt">) {
  const res = await fetch(`${BASE}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return (await res.json()) as Note;
}

export async function listNotes(params?: { farm?: string; lot?: string }) {
  const url = new URL(`${BASE}/notes`);
  if (params?.farm) url.searchParams.set("farm", params.farm);
  if (params?.lot) url.searchParams.set("lot", params.lot);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Error fetching notes");
  return (await res.json()) as Note[];
}
