import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImprovementViewer } from './infrastructure/persistence/schemas/improvement-viewer.entity';
import { AdminUsersService } from '../auth/admin-users.service';

@Injectable()
export class ImprovementViewersService {
  constructor(
    @InjectRepository(ImprovementViewer)
    private readonly repo: Repository<ImprovementViewer>,
    private readonly admins: AdminUsersService,
  ) {}

  /**
   * El usuario puede ver la sección de mejoras si está en la tabla
   * `improvement_viewers` o si es admin global.
   */
  async canView(email: string): Promise<boolean> {
    if (!email) return false;
    if (this.admins.isAdmin(email)) return true;
    const found = await this.repo.findOneBy({ email: email.toLowerCase() });
    return !!found;
  }

  async list(): Promise<ImprovementViewer[]> {
    return this.repo.find({ order: { email: 'ASC' } as never });
  }

  async add(email: string, addedBy: string): Promise<ImprovementViewer> {
    const e = email.trim().toLowerCase();
    const existing = await this.repo.findOneBy({ email: e });
    if (existing) {
      throw new ConflictException(`${e} ya tiene acceso.`);
    }
    const v = this.repo.create({
      email: e,
      added_by_email: addedBy.toLowerCase(),
    });
    return this.repo.save(v);
  }

  async remove(email: string): Promise<void> {
    const e = email.toLowerCase();
    const existing = await this.repo.findOneBy({ email: e });
    if (!existing) throw new NotFoundException(`${e} no estaba en la lista.`);
    await this.repo.delete({ email: e });
  }
}
