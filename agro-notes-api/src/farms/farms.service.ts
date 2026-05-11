import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Not, Repository } from 'typeorm';
import { Farm } from './infrastructure/persistence/schemas/farm.entity';
import {
  FarmMember,
  FarmRole,
} from './infrastructure/persistence/schemas/farm-member.entity';
import { Note } from '../notes/infrastructure/persistence/schemas/note.entity';
import { AdminUsersService } from '../auth/admin-users.service';

export type CallerContext = {
  email: string;
};

export type FarmWithRole = Farm & {
  /** Rol del caller respecto a esta farm: 'owner' | 'editor' | 'reader'. */
  my_role: 'owner' | FarmRole;
  /** Cantidad total de miembros (no incluye owner). */
  member_count: number;
};

export type AccessLevel = 'none' | 'reader' | 'editor' | 'owner';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm) private readonly farmRepo: Repository<Farm>,
    @InjectRepository(FarmMember)
    private readonly memberRepo: Repository<FarmMember>,
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
    private readonly admins: AdminUsersService,
  ) {}

  // -----------------------------------------------------------------
  // Helpers de permisos
  // -----------------------------------------------------------------

  /**
   * Devuelve el nivel de acceso del caller a la farm.
   * - owner: si es el owner_email.
   * - editor / reader: si está en farm_members con ese role.
   * - none: si no está y no es owner.
   *
   * Admin global NO sobrepasa esto a nivel de farm management — el
   * service responde con la verdad. La capa controller decide si un
   * admin puede saltarse.
   */
  async getAccess(farmId: string, email: string): Promise<AccessLevel> {
    const farm = await this.farmRepo.findOneBy({ id: farmId });
    if (!farm) return 'none';
    if (farm.owner_email === email) return 'owner';
    const member = await this.memberRepo.findOneBy({
      farm_id: farmId,
      email,
    });
    return member?.role ?? 'none';
  }

  /**
   * Lookup por (owner_email, name) — case-insensitive.
   * Usado por el filtro de visibilidad de notas.
   */
  async findByOwnerAndName(
    owner_email: string,
    name: string,
  ): Promise<Farm | null> {
    return this.farmRepo
      .createQueryBuilder('f')
      .where('f.owner_email = :owner', { owner: owner_email })
      .andWhere('LOWER(f.name) = LOWER(:name)', { name })
      .andWhere('f.deleted_at IS NULL')
      .getOne();
  }

  // -----------------------------------------------------------------
  // CRUD farm
  // -----------------------------------------------------------------

  async create(
    caller: CallerContext,
    dto: { name: string; description?: string },
  ): Promise<Farm> {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('El nombre es obligatorio.');

    const existing = await this.findByOwnerAndName(caller.email, name);
    if (existing) {
      throw new ConflictException(`Ya tenés una explotación llamada "${name}".`);
    }

    const farm = this.farmRepo.create({
      name,
      description: dto.description?.trim() || null,
      owner_email: caller.email,
    });
    return this.farmRepo.save(farm);
  }

  /**
   * Lista las farms accesibles al caller: las propias + aquellas en
   * las que es member. Devuelve también el role (owner/editor/reader)
   * y la cantidad de miembros.
   *
   * Admins ven TODAS las farms (sin filtro), con su role real (que
   * puede ser 'reader' implícito si no tienen membership formal).
   * Para no romper la abstracción, en admin sin role formal devolvemos
   * 'reader' como mínimo, pero el `isAdmin` del caller en el front
   * los habilita igual.
   */
  async listForCaller(caller: CallerContext): Promise<FarmWithRole[]> {
    const isAdmin = this.admins.isAdmin(caller.email);

    const qb = this.farmRepo
      .createQueryBuilder('f')
      .where('f.deleted_at IS NULL');

    if (!isAdmin) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('f.owner_email = :me', { me: caller.email }).orWhere(
            'EXISTS (SELECT 1 FROM farm_members m WHERE m.farm_id = f.id AND m.email = :me)',
            { me: caller.email },
          );
        }),
      );
    }

    qb.orderBy('LOWER(f.name)', 'ASC');

    const farms = await qb.getMany();
    if (farms.length === 0) return [];

    const ids = farms.map((f) => f.id);

    // Counts por farm (no incluye owner)
    const counts = await this.memberRepo
      .createQueryBuilder('m')
      .select('m.farm_id', 'farm_id')
      .addSelect('COUNT(*)::int', 'cnt')
      .where('m.farm_id IN (:...ids)', { ids })
      .groupBy('m.farm_id')
      .getRawMany<{ farm_id: string; cnt: number }>();
    const countByFarm = new Map(counts.map((c) => [c.farm_id, Number(c.cnt)]));

    // Roles del caller en estas farms
    const myMemberships = await this.memberRepo
      .createQueryBuilder('m')
      .where('m.farm_id IN (:...ids)', { ids })
      .andWhere('m.email = :me', { me: caller.email })
      .getMany();
    const roleByFarm = new Map(myMemberships.map((m) => [m.farm_id, m.role]));

    return farms.map<FarmWithRole>((f) => {
      const role: FarmWithRole['my_role'] =
        f.owner_email === caller.email
          ? 'owner'
          : (roleByFarm.get(f.id) ?? 'reader');
      return {
        ...f,
        my_role: role,
        member_count: countByFarm.get(f.id) ?? 0,
      };
    });
  }

  async getOrThrow(id: string): Promise<Farm> {
    const farm = await this.farmRepo.findOneBy({ id, deleted_at: IsNull() });
    if (!farm) throw new NotFoundException('Explotación no encontrada.');
    return farm;
  }

  async getDetail(
    id: string,
    caller: CallerContext,
  ): Promise<{ farm: Farm; my_role: FarmWithRole['my_role'] }> {
    const farm = await this.getOrThrow(id);
    const access = await this.getAccess(id, caller.email);
    if (access === 'none' && !this.admins.isAdmin(caller.email)) {
      throw new ForbiddenException('No tenés acceso a esta explotación.');
    }
    const my_role: FarmWithRole['my_role'] =
      farm.owner_email === caller.email
        ? 'owner'
        : ((access === 'none' ? 'reader' : access) as FarmRole);
    return { farm, my_role };
  }

  async update(
    id: string,
    dto: { name?: string; description?: string },
    caller: CallerContext,
  ): Promise<Farm> {
    const farm = await this.getOrThrow(id);
    const access = await this.getAccess(id, caller.email);
    const isAdmin = this.admins.isAdmin(caller.email);
    // Owner o editor pueden editar metadata de la farm.
    if (access !== 'owner' && access !== 'editor' && !isAdmin) {
      throw new ForbiddenException(
        'No tenés permiso para editar esta explotación.',
      );
    }

    const oldName = farm.name;
    const newName = dto.name?.trim();

    if (newName !== undefined && newName !== oldName) {
      // Validar no choque con otra farm del mismo owner
      const conflict = await this.findByOwnerAndName(farm.owner_email, newName);
      if (conflict && conflict.id !== farm.id) {
        throw new ConflictException(
          `Ya hay otra explotación llamada "${newName}".`,
        );
      }
      farm.name = newName;

      // Cascade: actualizar el campo `farm` de las notas del owner
      // que apuntan al nombre viejo (case-insensitive).
      await this.noteRepo
        .createQueryBuilder()
        .update(Note)
        .set({ farm: newName })
        .where('owner_email = :owner', { owner: farm.owner_email })
        .andWhere('LOWER(farm) = LOWER(:old)', { old: oldName })
        .execute();
    }

    if (dto.description !== undefined) {
      farm.description = dto.description.trim() || null;
    }

    return this.farmRepo.save(farm);
  }

  async remove(id: string, caller: CallerContext): Promise<void> {
    const farm = await this.getOrThrow(id);
    const isAdmin = this.admins.isAdmin(caller.email);
    if (farm.owner_email !== caller.email && !isAdmin) {
      throw new ForbiddenException('Solo el dueño puede borrar la explotación.');
    }
    farm.deleted_at = new Date();
    await this.farmRepo.save(farm);
    // Las notas no se borran: siguen existiendo como notas del owner.
    // La membership tampoco — al estar la farm deleted, las queries la
    // ignoran via `deleted_at IS NULL`.
  }

  // -----------------------------------------------------------------
  // Members
  // -----------------------------------------------------------------

  async listMembers(
    id: string,
    caller: CallerContext,
  ): Promise<{
    owner_email: string;
    members: FarmMember[];
  }> {
    const farm = await this.getOrThrow(id);
    const access = await this.getAccess(id, caller.email);
    const isAdmin = this.admins.isAdmin(caller.email);
    if (access === 'none' && !isAdmin) {
      throw new ForbiddenException('No tenés acceso a esta explotación.');
    }
    const members = await this.memberRepo.find({
      where: { farm_id: id },
      order: { email: 'ASC' } as never,
    });
    return { owner_email: farm.owner_email, members };
  }

  /**
   * Crea o actualiza el rol de un miembro.
   * Owner o editor pueden invitar (decisión del producto).
   */
  async upsertMember(
    id: string,
    dto: { email: string; role: FarmRole },
    caller: CallerContext,
  ): Promise<FarmMember> {
    const farm = await this.getOrThrow(id);
    const access = await this.getAccess(id, caller.email);
    const isAdmin = this.admins.isAdmin(caller.email);
    if (access !== 'owner' && access !== 'editor' && !isAdmin) {
      throw new ForbiddenException(
        'No tenés permiso para gestionar miembros de esta explotación.',
      );
    }

    const email = dto.email.trim().toLowerCase();
    if (email === farm.owner_email) {
      throw new BadRequestException(
        'No podés agregar al dueño como miembro: ya tiene acceso total.',
      );
    }

    const existing = await this.memberRepo.findOneBy({
      farm_id: id,
      email,
    });
    if (existing) {
      existing.role = dto.role;
      return this.memberRepo.save(existing);
    }
    const created = this.memberRepo.create({
      farm_id: id,
      email,
      role: dto.role,
    });
    return this.memberRepo.save(created);
  }

  async removeMember(
    id: string,
    email: string,
    caller: CallerContext,
  ): Promise<void> {
    const farm = await this.getOrThrow(id);
    const target = email.toLowerCase();
    const access = await this.getAccess(id, caller.email);
    const isAdmin = this.admins.isAdmin(caller.email);

    // Casos válidos:
    //  - Owner / editor / admin pueden quitar a cualquiera.
    //  - El propio member puede auto-quitarse.
    const canManage =
      access === 'owner' || access === 'editor' || isAdmin;
    const isSelf = caller.email === target;
    if (!canManage && !isSelf) {
      throw new ForbiddenException(
        'No tenés permiso para quitar miembros de esta explotación.',
      );
    }
    if (target === farm.owner_email) {
      throw new BadRequestException(
        'No se puede quitar al dueño. Transferí la explotación primero.',
      );
    }
    const found = await this.memberRepo.findOneBy({
      farm_id: id,
      email: target,
    });
    if (!found) throw new NotFoundException('Ese email no es miembro.');
    await this.memberRepo.delete(found);
  }
}
