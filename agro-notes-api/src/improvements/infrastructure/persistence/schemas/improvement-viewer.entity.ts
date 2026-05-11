import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

/**
 * Lista de emails con permiso para ver y crear "mejoras".
 *
 * Los admins (de la app, no de esta lista) gestionan esta tabla.
 * Cualquier usuario en la lista, o cualquier admin, ve la sección.
 */
@Entity('improvement_viewers')
export class ImprovementViewer {
  @PrimaryColumn({ type: 'varchar', length: 320 })
  email!: string;

  /**
   * Email del admin que agregó al viewer (auditoría blanda).
   */
  @Column({
    name: 'added_by_email',
    type: 'varchar',
    length: 320,
    nullable: true,
  })
  added_by_email?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;
}
