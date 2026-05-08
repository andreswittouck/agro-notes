import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notes')
@Index(['owner_email'])
@Index(['owner_email', 'farm'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Email del usuario que creó la nota. Sale del JWT de Firebase, no del
   * body. Es el "dueño" de la nota: solo él puede editarla / borrarla.
   *
   * NOT NULL con default para que el primer ALTER TABLE de TypeORM
   * (cuando se sincroniza el schema) backfillee las filas existentes
   * con el admin del entorno (`ADMIN_EMAILS[0]`). En entornos nuevos,
   * el código siempre setea este campo desde el JWT y el default no
   * aplica.
   */
  @Column({
    name: 'owner_email',
    type: 'varchar',
    length: 320,
    default: 'andreswittouck@gmail.com',
  })
  owner_email!: string;

  /**
   * Si es `true`, la nota es estrictamente personal: aunque la
   * explotación esté compartida, los invitados NO la ven. Solo el
   * dueño y los admins (con scope=all) la ven.
   */
  @Column({ name: 'is_private', type: 'boolean', default: false })
  is_private!: boolean;

  @Column({ name: 'farm', type: 'text', nullable: true })
  farm?: string;

  @Column({ name: 'lot', type: 'text', nullable: true })
  lot?: string;

  @Column({ name: 'weeds', type: 'text', array: true, default: [] })
  weeds?: string[];

  @Column({ name: 'applications', type: 'text', array: true, default: [] })
  applications?: string[];

  @Column({ name: 'note', type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'lat', type: 'double precision', nullable: true })
  lat?: number;

  @Column({ name: 'lng', type: 'double precision', nullable: true })
  lng?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date | null;
}
