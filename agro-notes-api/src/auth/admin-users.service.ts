import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Servicio de admins. La fuente de verdad es la env var `ADMIN_EMAILS`
 * (lista CSV de emails). Si está vacía, no hay admins (la app sigue
 * funcionando, solo nadie tendrá `scope=all` ni la capacidad de ver
 * notas de otros).
 *
 * Es complementario a `AuthorizedUsersService`: ser admin no implica
 * estar en la whitelist (aunque típicamente lo está).
 */
@Injectable()
export class AdminUsersService implements OnModuleInit {
  private readonly logger = new Logger(AdminUsersService.name);
  private readonly admins: Set<string>;

  constructor() {
    const raw = process.env.ADMIN_EMAILS || '';
    this.admins = new Set(
      raw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  onModuleInit(): void {
    if (this.admins.size === 0) {
      this.logger.warn(
        'ADMIN_EMAILS está vacía. Ningún usuario tendrá privilegios de admin.',
      );
    } else {
      this.logger.log(`Admins cargados: ${this.admins.size} email(s).`);
    }
  }

  isAdmin(email?: string | null): boolean {
    if (!email) return false;
    return this.admins.has(email.toLowerCase());
  }

  /**
   * Email canónico del primer admin configurado. Útil para backfills
   * (las notas legacy sin owner se asignan a este).
   */
  getPrimaryAdminEmail(): string | null {
    const first = this.admins.values().next();
    return first.done ? null : first.value;
  }
}
