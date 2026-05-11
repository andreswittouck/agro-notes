import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Permiso de lectura sobre TODAS las notas de una explotación.
 *
 * `owner_email` comparte la explotación `farm` con `shared_with_email`.
 * El invitado puede ver las notas de esa farm que NO sean is_private.
 *
 * PK compuesta = (owner_email, farm, shared_with_email) — evita duplicados.
 * Índice extra en shared_with_email para las queries de "qué me compartieron".
 */
@Entity('farm_shares')
@Index(['shared_with_email'])
export class FarmShare {
  @PrimaryColumn({ name: 'owner_email', type: 'varchar', length: 320 })
  owner_email!: string;

  @PrimaryColumn({ name: 'farm', type: 'varchar', length: 255 })
  farm!: string;

  @PrimaryColumn({ name: 'shared_with_email', type: 'varchar', length: 320 })
  shared_with_email!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;
}
