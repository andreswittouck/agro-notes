import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SharingService } from '../../sharing.service';
import { AuthGuard } from '../../../auth/auth.guard';
import { CurrentUser, FirebaseUser } from '../../../auth/auth.decorator';
import { AdminUsersService } from '../../../auth/admin-users.service';
import { CreateFarmShareDto } from '../../application/dto/create-farm-share.dto';

@ApiTags('sharing')
@ApiBearerAuth('firebase-auth')
@Controller('shares/farms')
@UseGuards(AuthGuard)
export class SharingController {
  constructor(
    private readonly service: SharingService,
    private readonly admins: AdminUsersService,
  ) {}

  @Get()
  async list(@CurrentUser() user: FirebaseUser) {
    const email = (user.email ?? '').toLowerCase();
    return this.service.listForCaller(email);
  }

  @Post()
  async create(
    @Body() dto: CreateFarmShareDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    const email = (user.email ?? '').toLowerCase();
    return this.service.create(email, dto);
  }

  @Delete(':owner/:farm/:sharedWith')
  async remove(
    @Param('owner') owner: string,
    @Param('farm') farm: string,
    @Param('sharedWith') sharedWith: string,
    @CurrentUser() user: FirebaseUser,
  ) {
    const me = (user.email ?? '').toLowerCase();
    const isAdmin = this.admins.isAdmin(me);
    // Solo el owner del share, o admin, pueden revocarlo.
    if (!isAdmin && me !== owner.toLowerCase()) {
      throw new ForbiddenException('Solo el dueño del acceso puede revocarlo.');
    }
    await this.service.remove({
      owner_email: owner,
      farm,
      shared_with_email: sharedWith,
    });
    return { success: true };
  }
}
