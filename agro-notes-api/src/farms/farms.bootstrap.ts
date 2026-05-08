import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Farm } from './infrastructure/persistence/schemas/farm.entity';
import { FarmMember } from './infrastructure/persistence/schemas/farm-member.entity';
import { Note } from '../notes/infrastructure/persistence/schemas/note.entity';

/**
 * Backfill idempotente que corre al arrancar la app:
 *
 * 1) Por cada par único (owner_email, farm) en `notes`, crea una `farms`
 *    si no existe todavía (case-insensitive).
 *
 * 2) Por cada row en `farm_shares` (tabla legacy del Hito 3), crea un
 *    `farm_members` con role='reader' apuntando a la farm equivalente.
 *
 * Si la tabla `farm_shares` no existe en este entorno (deploy nuevo),
 * el paso 2 se saltea silenciosamente.
 *
 * Diseñado para ser seguro de correr varias veces — solo inserta lo
 * que falta.
 */
@Injectable()
export class FarmsBootstrap implements OnModuleInit {
  private readonly logger = new Logger(FarmsBootstrap.name);

  constructor(
    @InjectRepository(Farm) private readonly farmRepo: Repository<Farm>,
    @InjectRepository(FarmMember)
    private readonly memberRepo: Repository<FarmMember>,
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
    private readonly ds: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const createdFarms = await this.backfillFarmsFromNotes();
      const migratedMembers = await this.migrateLegacyShares();
      if (createdFarms > 0 || migratedMembers > 0) {
        this.logger.log(
          `Backfill: ${createdFarms} farm(s) creadas, ${migratedMembers} share(s) migradas a farm_members.`,
        );
      } else {
        this.logger.log('Backfill: nada que hacer.');
      }
    } catch (e) {
      this.logger.error('Backfill falló (no bloqueante):', e as Error);
    }
  }

  private async backfillFarmsFromNotes(): Promise<number> {
    const rows = await this.noteRepo
      .createQueryBuilder('n')
      .select('n.owner_email', 'owner_email')
      .addSelect('n.farm', 'farm')
      .where('n.farm IS NOT NULL')
      .andWhere(`n.farm <> ''`)
      .groupBy('n.owner_email')
      .addGroupBy('n.farm')
      .getRawMany<{ owner_email: string; farm: string }>();

    let created = 0;
    for (const row of rows) {
      const existing = await this.farmRepo
        .createQueryBuilder('f')
        .where('f.owner_email = :owner', { owner: row.owner_email })
        .andWhere('LOWER(f.name) = LOWER(:name)', { name: row.farm })
        .andWhere('f.deleted_at IS NULL')
        .getOne();
      if (existing) continue;
      const farm = this.farmRepo.create({
        owner_email: row.owner_email,
        name: row.farm,
      });
      await this.farmRepo.save(farm);
      created++;
    }
    return created;
  }

  private async migrateLegacyShares(): Promise<number> {
    // ¿Existe la tabla farm_shares? (en schemas nuevos puede no existir)
    const hasShares = await this.tableExists('farm_shares');
    if (!hasShares) return 0;

    type ShareRow = {
      owner_email: string;
      farm: string;
      shared_with_email: string;
    };
    const shares = await this.ds.query<ShareRow[]>(
      `SELECT owner_email, farm, shared_with_email FROM farm_shares`,
    );
    if (shares.length === 0) return 0;

    let migrated = 0;
    for (const s of shares) {
      // Resolver la farm correspondiente
      const farm = await this.farmRepo
        .createQueryBuilder('f')
        .where('f.owner_email = :owner', { owner: s.owner_email })
        .andWhere('LOWER(f.name) = LOWER(:name)', { name: s.farm })
        .andWhere('f.deleted_at IS NULL')
        .getOne();
      if (!farm) continue;

      const email = s.shared_with_email.toLowerCase();
      const exists = await this.memberRepo.findOneBy({
        farm_id: farm.id,
        email,
      });
      if (exists) continue;

      await this.memberRepo.save(
        this.memberRepo.create({
          farm_id: farm.id,
          email,
          role: 'reader',
        }),
      );
      migrated++;
    }
    return migrated;
  }

  private async tableExists(table: string): Promise<boolean> {
    try {
      const rows = await this.ds.query<{ exists: boolean }[]>(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = $1
         ) AS "exists"`,
        [table],
      );
      return rows[0]?.exists === true;
    } catch {
      return false;
    }
  }
}
