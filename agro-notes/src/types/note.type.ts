export type ApiNote = {
  id: string;
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

export type LocalNote = ApiNote & {
  syncStatus: "synced" | "pending" | "error";
  operation?: "create" | "update" | "delete";
};

export type CreateNotePayload = {
  id?: string; // lo vamos a generar en el cliente cuando esté offline
  farm: string;
  lot: string;
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
  created_at?: string; // timestamp local si existe
};
