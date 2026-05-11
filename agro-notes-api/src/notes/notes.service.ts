import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Note } from './infrastructure/persistence/schemas/note.entity';
import { FarmMember } from '../farms/infrastructure/persistence/schemas/farm-member.entity';
import { Farm } from '../farms/infrastructure/persistence/schemas/farm.entity';
import { AdminUsersService } from '../auth/admin-users.service';

export type CreateNoteDto = {
  farm: string;
  lot: string;
  created_at?: string;
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
  is_private?: boolean;
};

export type UpdateNoteDto = Partial<{
  farm: string;
  lot: string;
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
  is_private?: boolean;
}>;

export type Scope = 'mine' | 'all';

export type CallerContext = {
  email: string;
  scope?: Scope;
};

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private readonly repo: Repository<Note>,
    @InjectRepository(FarmMember)
    private readonly memberRepo: Repository<FarmMember>,
    @InjectRepository(Farm) private readonly farmRepo: Repository<Farm>,
    private readonly admins: AdminUsersService,
  ) {}

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------

  /**
   * Visibilidad:
   *  - Admin con scope=all → sin filtro.
   *  - Resto: ves tus propias notas, o las notas de explotaciones donde
   *    sos miembro (reader o editor) Y la nota no es is_private.
   *
   * El "match" entre la nota y la farm es por (owner_email, name)
   * case-insensitive. Las notas con `farm` que no corresponden a
   * ninguna entidad `farms` son personales del owner.
   */
  private applyVisibility(
    qb: SelectQueryBuilder<Note>,
    caller: CallerContext,
  ): SelectQueryBuilder<Note> {
    const isAdmin = this.admins.isAdmin(caller.email);
    if (isAdmin && caller.scope === 'all') {
      return qb;
    }

    qb.andWhere(
      `(
        n.owner_email = :me
        OR (
          n.is_private = false
          AND EXISTS (
            SELECT 1
            FROM farms f
            JOIN farm_members m ON m.farm_id = f.id
            WHERE f.owner_email = n.owner_email
              AND LOWER(f.name) = LOWER(n.farm)
              AND f.deleted_at IS NULL
              AND m.email = :me
          )
        )
      )`,
      { me: caller.email },
    );
    return qb;
  }

  private async getOrThrow(id: string): Promise<Note> {
    const note = await this.repo.findOneBy({ id });
    if (!note) throw new NotFoundException(`Note ${id} not found`);
    return note;
  }

  /**
   * Resolver el rol del caller respecto a la farm al que pertenece la nota.
   *  - 'owner'  → es el owner_email de la nota (siempre puede).
   *  - 'editor' → es editor en farm_members de la farm matching.
   *  - 'reader' → es reader en farm_members de la farm matching.
   *  - 'none'   → no tiene relación.
   */
  private async getNoteAccess(
    note: Note,
    caller: CallerContext,
  ): Promise<'owner' | 'editor' | 'reader' | 'none'> {
    if (note.owner_email === caller.email) return 'owner';
    const farm = await this.farmRepo
      .createQueryBuilder('f')
      .where('f.owner_email = :owner', { owner: note.owner_email })
      .andWhere('LOWER(f.name) = LOWER(:name)', { name: note.farm ?? '' })
      .andWhere('f.deleted_at IS NULL')
      .getOne();
    if (!farm) return 'none';
    const member = await this.memberRepo.findOneBy({
      farm_id: farm.id,
      email: caller.email,
    });
    if (!member) return 'none';
    return member.role;
  }

  private async assertCanRead(
    note: Note,
    caller: CallerContext,
  ): Promise<void> {
    if (this.admins.isAdmin(caller.email)) return;
    const access = await this.getNoteAccess(note, caller);
    if (access === 'owner') return;
    if (note.is_private) {
      throw new ForbiddenException('No tenés acceso a esta nota.');
    }
    if (access === 'reader' || access === 'editor') return;
    throw new ForbiddenException('No tenés acceso a esta nota.');
  }

  /**
   * Edit/delete: owner, editor de la farm, o admin global.
   */
  private async assertCanWrite(
    note: Note,
    caller: CallerContext,
  ): Promise<void> {
    if (this.admins.isAdmin(caller.email)) return;
    const access = await this.getNoteAccess(note, caller);
    if (access === 'owner' || access === 'editor') return;
    throw new ForbiddenException('No tenés permiso para modificar esta nota.');
  }

  // -----------------------------------------------------------------
  // Operaciones
  // -----------------------------------------------------------------

  async create(dto: CreateNoteDto, caller: CallerContext): Promise<Note> {
    const note = this.repo.create({
      ...dto,
      owner_email: caller.email,
      is_private: dto.is_private ?? false,
      created_at: dto.created_at ? new Date(dto.created_at) : undefined,
    });
    return this.repo.save(note);
  }

  async list(
    filter: { farm?: string; lot?: string },
    caller: CallerContext,
  ): Promise<Note[]> {
    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.deleted_at IS NULL')
      .orderBy('n.created_at', 'DESC');

    if (filter.farm) qb.andWhere('LOWER(n.farm) = LOWER(:e)', { e: filter.farm });
    if (filter.lot) qb.andWhere('LOWER(n.lot) = LOWER(:l)', { l: filter.lot });

    this.applyVisibility(qb, caller);
    return qb.getMany();
  }

  async get(id: string, caller: CallerContext): Promise<Note> {
    const note = await this.getOrThrow(id);
    await this.assertCanRead(note, caller);
    return note;
  }

  async listChanges(
    since: string,
    filter: { farm?: string; lot?: string },
    caller: CallerContext,
  ): Promise<Note[]> {
    const sinceDate = new Date(since);
    const qb = this.repo
      .createQueryBuilder('n')
      .where('(n.updated_at > :since OR n.created_at > :since)', {
        since: sinceDate,
      })
      .orderBy('n.updated_at', 'ASC');

    if (filter.farm) qb.andWhere('LOWER(n.farm) = LOWER(:e)', { e: filter.farm });
    if (filter.lot) qb.andWhere('LOWER(n.lot) = LOWER(:l)', { l: filter.lot });

    this.applyVisibility(qb, caller);
    return qb.getMany();
  }

  async update(
    id: string,
    dto: UpdateNoteDto,
    caller: CallerContext,
  ): Promise<Note> {
    const note = await this.getOrThrow(id);
    await this.assertCanWrite(note, caller);

    Object.assign(note, dto);
    note.updated_at = new Date();
    return this.repo.save(note);
  }

  async softDelete(id: string, caller: CallerContext): Promise<void> {
    const note = await this.getOrThrow(id);
    await this.assertCanWrite(note, caller);

    await this.repo.update(
      { id },
      {
        deleted_at: new Date(),
        updated_at: new Date(),
      } as Partial<Note>,
    );
  }
}
