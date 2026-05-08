// agro-notes-api/src/auth/authorized-users.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Servicio para gestionar usuarios autorizados.
 * La fuente de verdad es la variable de entorno AUTHORIZED_EMAILS
 * (lista de emails separada por comas).
 *
 * Comportamiento fail-closed: si no hay ningún email configurado,
 * el servicio DENIEGA todos los requests. En producción además se
 * hace fail-fast al arrancar la app.
 */
@Injectable()
export class AuthorizedUsersService implements OnModuleInit {
  private readonly logger = new Logger(AuthorizedUsersService.name);
  private readonly authorizedEmails: Set<string>;

  constructor() {
    const emailsEnv = process.env.AUTHORIZED_EMAILS || '';
    const emailsFromEnv = emailsEnv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    this.authorizedEmails = new Set(emailsFromEnv);
  }

  /**
   * Fail-fast: si al iniciar la app no hay emails autorizados configurados
   * y estamos en producción, abortamos el arranque en vez de exponer la API.
   */
  onModuleInit(): void {
    if (this.authorizedEmails.size === 0) {
      const msg =
        'AUTHORIZED_EMAILS está vacía: ningún usuario podrá acceder a la API. ' +
        'Configurá la variable de entorno con la lista de emails autorizados ' +
        '(separados por comas).';

      if (process.env.NODE_ENV === 'production') {
        this.logger.error(msg);
        throw new Error('AUTHORIZED_EMAILS no configurada (fail-fast en producción).');
      }

      this.logger.warn(msg);
    } else {
      this.logger.log(
        `Whitelist de autorización cargada: ${this.authorizedEmails.size} email(s).`,
      );
    }
  }

  /**
   * Verifica si un email está autorizado.
   * Fail-closed: si la whitelist está vacía, deniega todo.
   */
  isAuthorized(email: string): boolean {
    if (!email) return false;
    if (this.authorizedEmails.size === 0) return false;

    return this.authorizedEmails.has(email.toLowerCase());
  }

  /**
   * Obtiene la lista de emails autorizados (sin exponer información sensible)
   */
  getAuthorizedCount(): number {
    return this.authorizedEmails.size;
  }

  /**
   * Agrega un email a la lista de autorizados (útil para APIs de administración)
   */
  addAuthorizedEmail(email: string): void {
    this.authorizedEmails.add(email.toLowerCase());
  }
}
