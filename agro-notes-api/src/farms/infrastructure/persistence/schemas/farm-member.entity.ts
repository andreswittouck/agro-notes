import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

export type FarmRole = 'reader' | 'editor';

/**
 * Membresía en una farm. Reemplaza al modelo viejo de farm_shares
 * agregando `role`.
 *
 * Al owner NO se le crea un row aquí: se considera "member implícito"
 * con todos los permisos. Esto evita inconsistencias.
 *
 * PK compuesta = (farm_id, email).
 */
@Entity('farm_members')
@Index(['email'])
export class FarmMember {
  @PrimaryColumn({ name: 'farm_id', type: 'uuid' })
  farm_id!: string;

  @PrimaryColumn({ type: 'varchar', length: 320 })
  email!: string;

  @Column({ type: 'varchar', length: 16, default: 'reader' })
  role!: FarmRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;
}
