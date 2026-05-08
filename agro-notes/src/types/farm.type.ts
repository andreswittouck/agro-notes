/**
 * Roles formales en la tabla farm_members. El owner se trata como rol
 * derivado (no se guarda en la tabla, pero al exponerlo en la UI lo
 * etiquetamos como `'owner'`).
 */
export type FarmRole = "reader" | "editor";
export type EffectiveRole = "owner" | FarmRole;

export type Farm = {
  id: string;
  name: string;
  description?: string | null;
  owner_email: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type FarmWithRole = Farm & {
  /** Rol del usuario actual respecto a esta farm. */
  my_role: EffectiveRole;
  /** Cantidad de miembros (no incluye al owner). */
  member_count: number;
};

export type FarmMember = {
  farm_id: string;
  email: string;
  role: FarmRole;
  created_at: string;
};

export type FarmDetail = {
  farm: Farm;
  my_role: EffectiveRole;
};

export type FarmMembersResponse = {
  owner_email: string;
  members: FarmMember[];
};
