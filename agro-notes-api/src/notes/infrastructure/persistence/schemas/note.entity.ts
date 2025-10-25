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
  @Column({ name: 'farm', type: 'text', nullable: false })
  farm!: string;

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
}
