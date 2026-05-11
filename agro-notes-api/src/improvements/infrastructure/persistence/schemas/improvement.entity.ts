import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Idea / sugerencia de mejora del producto.
 *
 * Es un panel compartido: cualquier viewer puede crear y todos los
 * viewers ven todas las ideas. Edición/borrado restringido al creador
 * (`owner_email`) o a un admin global.
 */
@Entity('improvements')
@Index(['owner_email'])
export class Improvement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string | null;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'owner_email', type: 'varchar', length: 320 })
  owner_email!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date | null;
}
