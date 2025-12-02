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
