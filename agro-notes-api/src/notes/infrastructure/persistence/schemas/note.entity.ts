import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  farm!: string; // "Juan Carlos"

  @Column({ length: 60 })
  lot!: string; // "24"

  @CreateDateColumn()
  created_at!: Date; // auto-set

  @Column('text', { array: true, default: [] })
  weeds!: string[]; // ["gramilla", "rama negra"]

  @Column('text', { array: true, default: [] })
  applications!: string[]; // ["2,4-D", "glifosato"]

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'float', nullable: true })
  lat?: number;

  @Column({ type: 'float', nullable: true })
  lng?: number;
}
