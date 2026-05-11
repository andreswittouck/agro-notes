import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, FirebaseUser } from '../auth/auth.decorator';
import { AdminUsersService } from '../auth/admin-users.service';
import { ImprovementViewersService } from '../improvements/improvement-viewers.service';

/**
 * Endpoint que devuelve los datos del usuario actualmente autenticado.
 * Lo consume el frontend para saber capacidades:
 *  - `isAdmin`: muestra el switch admin / habilita rutas de admin.
 *  - `canViewImprovements`: muestra la tarjeta "Mejoras" en home.
 */
@ApiTags('users')
@ApiBearerAuth('firebase-auth')
@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(
    private readonly admins: AdminUsersService,
    private readonly improvementViewers: ImprovementViewersService,
  ) {}

  @Get()
  async me(@CurrentUser() user: FirebaseUser) {
    const email = (user.email ?? '').toLowerCase();
    const [isAdmin, canViewImprovements] = await Promise.all([
      Promise.resolve(this.admins.isAdmin(email)),
      this.improvementViewers.canView(email),
    ]);
    return {
      uid: user.uid,
      email,
      emailVerified: user.emailVerified,
      isAdmin,
      canViewImprovements,
    };
  }
}
