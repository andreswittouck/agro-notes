// agro-notes-api/src/auth/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { firebaseAdmin } from './firebase-admin';
import { AuthorizedUsersService } from './authorized-users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly authorizedUsersService: AuthorizedUsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      // Verificar el token con Firebase Admin
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);

      const email = decodedToken.email;

      if (!email) {
        throw new UnauthorizedException('Email no disponible en el token');
      }

      // Verificar si el usuario está autorizado
      if (!this.authorizedUsersService.isAuthorized(email)) {
        throw new ForbiddenException(
          'Tu email no está autorizado para acceder a esta aplicación. Contacta al administrador.',
        );
      }

      (request as Request & { user?: unknown }).user = {
        uid: decodedToken.uid,
        email: email,
        emailVerified: decodedToken.email_verified,
      };

      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Mostrar el motivo real para diagnosticar (mismatch de project,
      // clock skew, token corrupto, etc). En prod este log sería WARN
      // sin volcar el token completo.
      const err = error as { code?: string; message?: string };
      this.logger.warn(
        `verifyIdToken falló — code=${err?.code ?? 'unknown'} msg=${
          err?.message ?? 'unknown'
        }`,
      );
      // Pista útil para mismatch de proyecto / clock skew
      if (err?.code === 'auth/argument-error') {
        this.logger.warn(
          'auth/argument-error: el token podría estar firmado por un proyecto distinto al de firebase-admin-key.json. Revisar project_id.',
        );
      }
      if (
        err?.message?.includes('Token used too early') ||
        err?.message?.includes('Firebase ID token has expired')
      ) {
        this.logger.warn(
          'Posible reloj desincronizado entre cliente y servidor o token vencido.',
        );
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
