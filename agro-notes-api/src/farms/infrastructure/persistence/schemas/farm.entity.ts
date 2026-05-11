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
 * Explotación. Es entidad de primera clase a partir del Hito de farms.
 *
 * El nombre es único por dueño: dos usuarios distintos pueden tener
 * cada uno su propia "Juan Carlos" sin chocar.
 *
 * Las notas siguen guardando `farm` como string libre (el name);
 * la asociación es por nombre, no por FK. Esto mantiene compatibilidad
 * con la voz y con las notas legacy. Cuando se renombra una farm,
 * el servicio actualiza en cascada el campo `farm` de las notas
 * del mismo `owner_email`.
 */
@Entity('farms')
@Index('uq_farms_owner_name', ['owner_email', 'name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'owner_email', type: 'varchar', length: 320 })
  @Index()
  owner_email!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date | null;
}
