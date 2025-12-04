import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './infrastructure/persistence/schemas/note.entity';

export type CreateNoteDto = {
  farm: string;
  lot: string;
  created_at?: string; // ISO opcional
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
};

// para editar, todos los campos opcionales
export type UpdateNoteDto = Partial<{
  farm: string;
  lot: string;
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
}>;

@Injectable()
export class NotesService {
  constructor(@InjectRepository(Note) private readonly repo: Repository<Note>) {}

  async create(dto: CreateNoteDto) {
    const note = this.repo.create({
      ...dto,
      created_at: dto.created_at ? new Date(dto.created_at) : undefined,
    });
    return this.repo.save(note);
  }

  async list(filter: { farm?: string; lot?: string }) {
    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.deleted_at IS NULL') // <- opcional pero recomendado
      .orderBy('n.created_at', 'DESC');

    if (filter.farm) qb.andWhere('LOWER(n.farm) = LOWER(:e)', { e: filter.farm });
    if (filter.lot) qb.andWhere('LOWER(n.lot) = LOWER(:l)', { l: filter.lot });

    return qb.getMany();
  }

  async get(id: string) {
    return this.repo.findOneByOrFail({ id });
  }

  async listChanges(since: string, filter: { farm?: string; lot?: string }) {
    const sinceDate = new Date(since);
    const qb = this.repo
      .createQueryBuilder('n')
      .where('(n.updated_at > :since OR n.created_at > :since)', { since: sinceDate }) // incluye nuevos y editados
      .orderBy('n.updated_at', 'ASC');

    if (filter.farm) qb.andWhere('LOWER(n.farm) = LOWER(:e)', { e: filter.farm });
    if (filter.lot) qb.andWhere('LOWER(n.lot) = LOWER(:l)', { l: filter.lot });

    return qb.getMany();
  }

  async update(id: string, dto: UpdateNoteDto) {
    const note = await this.repo.findOneByOrFail({ id });

    Object.assign(note, dto);
    // actualizamos updated_at para que entre en /changes
    note.updated_at = new Date();

    return this.repo.save(note);
  }

  async softDelete(id: string) {
    // borrado lógico: marcamos deleted_at y updated_at
    await this.repo.update({ id }, {
      deleted_at: new Date(),
      updated_at: new Date(),
    } as any);
  }
}
