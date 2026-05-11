import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth/auth.guard';
import { CurrentUser, FirebaseUser } from '../../../auth/auth.decorator';
import { AdminUsersService } from '../../../auth/admin-users.service';
import { ImprovementsService } from '../../improvements.service';
import { ImprovementViewersService } from '../../improvement-viewers.service';
import { CreateImprovementDto } from '../../application/dto/create-improvement.dto';
import { UpdateImprovementDto } from '../../application/dto/update-improvement.dto';
import { AddViewerDto } from '../../application/dto/add-viewer.dto';

function caller(user: FirebaseUser) {
  return { email: (user.email ?? '').toLowerCase() };
}

@ApiTags('improvements')
@ApiBearerAuth('firebase-auth')
@Controller('improvements')
@UseGuards(AuthGuard)
export class ImprovementsController {
  constructor(
    private readonly service: ImprovementsService,
    private readonly viewers: ImprovementViewersService,
    private readonly admins: AdminUsersService,
  ) {}

  @Get()
  list(@CurrentUser() user: FirebaseUser) {
    return this.service.list(caller(user));
  }

  @Post()
  create(
    @Body() dto: CreateImprovementDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    return this.service.create(caller(user), dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateImprovementDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    return this.service.update(id, dto, caller(user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: FirebaseUser) {
    await this.service.softDelete(id, caller(user));
    return { success: true };
  }

  // ---------- Viewers (solo admin) ----------

  @Get('viewers/list')
  async listViewers(@CurrentUser() user: FirebaseUser) {
    const me = (user.email ?? '').toLowerCase();
    if (!this.admins.isAdmin(me)) {
      throw new ForbiddenException('Solo admins pueden listar los viewers.');
    }
    return this.viewers.list();
  }

  @Post('viewers')
  async addViewer(
    @Body() dto: AddViewerDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    const me = (user.email ?? '').toLowerCase();
    if (!this.admins.isAdmin(me)) {
      throw new ForbiddenException(
        'Solo admins pueden gestionar los viewers.',
      );
    }
    return this.viewers.add(dto.email, me);
  }

  @Delete('viewers/:email')
  async removeViewer(
    @Param('email') email: string,
    @CurrentUser() user: FirebaseUser,
  ) {
    const me = (user.email ?? '').toLowerCase();
    if (!this.admins.isAdmin(me)) {
      throw new ForbiddenException(
        'Solo admins pueden gestionar los viewers.',
      );
    }
    await this.viewers.remove(email);
    return { success: true };
  }
}
