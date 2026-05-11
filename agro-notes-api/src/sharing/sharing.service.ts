import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmShare } from './infrastructure/persistence/schemas/farm-share.entity';

export type FarmSharesList = {
  /** Shares que el caller creó: explotaciones suyas que cedió a otros. */
  granted: FarmShare[];
  /** Shares que recibió: explotaciones de otros a las que tiene acceso. */
  received: FarmShare[];
};

@Injectable()
export class SharingService {
  constructor(
    @InjectRepository(FarmShare)
    private readonly repo: Repository<FarmShare>,
  ) {}

  /**
   * Lista los shares "granted by me" + "received by me".
   */
  async listForCaller(callerEmail: string): Promise<FarmSharesList> {
    const me = callerEmail.toLowerCase();
    const [granted, received] = await Promise.all([
      this.repo.find({
        where: { owner_email: me },
        order: { farm: 'ASC' },
      }),
      this.repo.find({
        where: { shared_with_email: me },
        order: { farm: 'ASC' },
      }),
    ]);
    return { granted, received };
  }

  /**
   * Crea un share. El owner siempre es el caller (no se puede crear
   * shares en nombre de otro). No se permite compartir consigo mismo.
   */
  async create(
    callerEmail: string,
    dto: { farm: string; shared_with_email: string },
  ): Promise<FarmShare> {
    const owner = callerEmail.toLowerCase();
    const sharedWith = dto.shared_with_email.toLowerCase();
    const farm = dto.farm.trim();

    if (!farm) {
      throw new BadRequestException('La explotación es obligatoria.');
    }
    if (owner === sharedWith) {
      throw new BadRequestException('No podés compartir contigo mismo.');
    }

    const existing = await this.repo.findOneBy({
      owner_email: owner,
      farm,
      shared_with_email: sharedWith,
    });
    if (existing) {
      throw new ConflictException(
        `Ya compartiste "${farm}" con ${sharedWith}.`,
      );
    }

    const share = this.repo.create({
      owner_email: owner,
      farm,
      shared_with_email: sharedWith,
    });
    return this.repo.save(share);
  }

  /**
   * Borra un share. El caller debe ser el owner del share, o admin.
   * (El check de admin lo agrega el controller; acá asumimos que está
   * autorizado.)
   */
  async remove(args: {
    owner_email: string;
    farm: string;
    shared_with_email: string;
  }): Promise<void> {
    const found = await this.repo.findOneBy({
      owner_email: args.owner_email.toLowerCase(),
      farm: args.farm,
      shared_with_email: args.shared_with_email.toLowerCase(),
    });
    if (!found) {
      throw new NotFoundException('No existe ese acceso.');
    }
    await this.repo.delete(found);
  }
}
