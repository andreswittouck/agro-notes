export type Improvement = {
  id: string;
  title?: string | null;
  body: string;
  owner_email: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type ImprovementViewer = {
  email: string;
  added_by_email?: string | null;
  created_at: string;
};
