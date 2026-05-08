import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import {
  NotesService,
  CreateNoteDto,
  UpdateNoteDto,
  Scope,
} from '../../notes.service';
import { AuthGuard } from '../../../auth/auth.guard';
import { CurrentUser, FirebaseUser } from '../../../auth/auth.decorator';

function asCaller(user: FirebaseUser, scope?: string) {
  const s: Scope | undefined = scope === 'all' ? 'all' : scope === 'mine' ? 'mine' : undefined;
  return {
    email: (user.email ?? '').toLowerCase(),
    scope: s,
  };
}

@ApiTags('notes')
@ApiBearerAuth('firebase-auth')
@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Post()
  create(
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    return this.service.create(dto, asCaller(user));
  }

  @Get()
  @ApiQuery({ name: 'farm', required: false })
  @ApiQuery({ name: 'lot', required: false })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['mine', 'all'],
    description:
      'Solo aplica a admins. `all` = ver TODAS las notas del sistema. Default `mine`.',
  })
  list(
    @CurrentUser() user: FirebaseUser,
    @Query('farm') farm?: string,
    @Query('lot') lot?: string,
    @Query('scope') scope?: string,
  ) {
    return this.service.list({ farm, lot }, asCaller(user, scope));
  }

  @Get('changes')
  @ApiQuery({ name: 'since', required: true })
  @ApiQuery({ name: 'farm', required: false })
  @ApiQuery({ name: 'lot', required: false })
  @ApiQuery({ name: 'scope', required: false, enum: ['mine', 'all'] })
  listChanges(
    @CurrentUser() user: FirebaseUser,
    @Query('since') since: string,
    @Query('farm') farm?: string,
    @Query('lot') lot?: string,
    @Query('scope') scope?: string,
  ) {
    return this.service.listChanges(since, { farm, lot }, asCaller(user, scope));
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: FirebaseUser) {
    return this.service.get(id, asCaller(user));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    return this.service.update(id, dto, asCaller(user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: FirebaseUser) {
    await this.service.softDelete(id, asCaller(user));
    return { success: true };
  }
}
