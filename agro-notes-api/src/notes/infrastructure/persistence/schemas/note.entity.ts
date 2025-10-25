import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // 👇 campo obligatorio
  @Column({ name: 'explotacion', type: 'text', nullable: false })
  explotacion!: string;

  @Column({ name: 'lote', type: 'text', nullable: true })
  lote?: string;

  @Column({ name: 'malezas', type: 'text', array: true, default: [] })
  malezas?: string[];

  @Column({ name: 'aplicaciones', type: 'text', array: true, default: [] })
  aplicaciones?: string[];

  @Column({ name: 'nota', type: 'text', nullable: true })
  nota?: string;

  @Column({ name: 'lat', type: 'double precision', nullable: true })
  lat?: number;

  @Column({ name: 'lng', type: 'double precision', nullable: true })
  lng?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at!: Date;
}
