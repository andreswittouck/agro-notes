import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Improvement } from './infrastructure/persistence/schemas/improvement.entity';
import { ImprovementViewersService } from './improvement-viewers.service';
import { AdminUsersService } from '../auth/admin-users.service';

export type CallerContext = { email: string };

@Injectable()
export class ImprovementsService {
  constructor(
    @InjectRepository(Improvement)
    private readonly repo: Repository<Improvement>,
    private readonly viewers: ImprovementViewersService,
    private readonly admins: AdminUsersService,
  ) {}

  /**
   * Verifica que el caller pueda usar la sección. Si no, 403.
   */
  private async assertCanAccess(caller: CallerContext): Promise<void> {
    const ok = await this.viewers.canView(caller.email);
    if (!ok) {
      throw new ForbiddenException(
        'No tenés acceso a la sección de mejoras.',
      );
    }
  }

  async list(caller: CallerContext): Promise<Improvement[]> {
    await this.assertCanAccess(caller);
    return this.repo
      .createQueryBuilder('i')
      .where('i.deleted_at IS NULL')
      .orderBy('i.created_at', 'DESC')
      .getMany();
  }

  async create(
    caller: CallerContext,
    dto: { title?: string; body: string },
  ): Promise<Improvement> {
    await this.assertCanAccess(caller);
    const item = this.repo.create({
      title: dto.title?.trim() || null,
      body: dto.body.trim(),
      owner_email: caller.email,
    });
    return this.repo.save(item);
  }

  async update(
    id: string,
    dto: { title?: string; body?: string },
    caller: CallerContext,
  ): Promise<Improvement> {
    await this.assertCanAccess(caller);
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Mejora no encontrada.');
    if (
      item.owner_email !== caller.email &&
      !this.admins.isAdmin(caller.email)
    ) {
      throw new ForbiddenException(
        'Solo el creador (o un admin) puede modificar esta mejora.',
      );
    }
    if (dto.title !== undefined) item.title = dto.title.trim() || null;
    if (dto.body !== undefined) item.body = dto.body.trim();
    item.updated_at = new Date();
    return this.repo.save(item);
  }

  async softDelete(id: string, caller: CallerContext): Promise<void> {
    await this.assertCanAccess(caller);
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Mejora no encontrada.');
    if (
      item.owner_email !== caller.email &&
      !this.admins.isAdmin(caller.email)
    ) {
      throw new ForbiddenException(
        'Solo el creador (o un admin) puede borrar esta mejora.',
      );
    }
    item.deleted_at = new Date();
    item.updated_at = new Date();
    await this.repo.save(item);
  }
}
