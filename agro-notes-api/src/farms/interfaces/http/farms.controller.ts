import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FarmsService } from '../../farms.service';
import { AuthGuard } from '../../../auth/auth.guard';
import { CurrentUser, FirebaseUser } from '../../../auth/auth.decorator';
import { CreateFarmDto } from '../../application/dto/create-farm.dto';
import { UpdateFarmDto } from '../../application/dto/update-farm.dto';
import { UpsertMemberDto } from '../../application/dto/upsert-member.dto';

function caller(user: FirebaseUser) {
  return { email: (user.email ?? '').toLowerCase() };
}

@ApiTags('farms')
@ApiBearerAuth('firebase-auth')
@Controller('farms')
@UseGuards(AuthGuard)
export class FarmsController {
  constructor(private readonly service: FarmsService) {}

  @Get()
  list(@CurrentUser() user: FirebaseUser) {
    return this.service.listForCaller(caller(user));
  }

  @Post()
  create(@Body() dto: CreateFarmDto, @CurrentUser() user: FirebaseUser) {
    return this.service.create(caller(user), dto);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: FirebaseUser) {
    return this.service.getDetail(id, caller(user));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFarmDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    return this.service.update(id, dto, caller(user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: FirebaseUser) {
    await this.service.remove(id, caller(user));
    return { success: true };
  }

  // ---------- Miembros ----------

  @Get(':id/members')
  listMembers(@Param('id') id: string, @CurrentUser() user: FirebaseUser) {
    return this.service.listMembers(id, caller(user));
  }

  @Post(':id/members')
  upsertMember(
    @Param('id') id: string,
    @Body() dto: UpsertMemberDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    return this.service.upsertMember(id, dto, caller(user));
  }

  @Delete(':id/members/:email')
  async removeMember(
    @Param('id') id: string,
    @Param('email') email: string,
    @CurrentUser() user: FirebaseUser,
  ) {
    await this.service.removeMember(id, email, caller(user));
    return { success: true };
  }
}
