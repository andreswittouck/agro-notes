import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { NotesService, CreateNoteDto, UpdateNoteDto } from '../../notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Post()
  create(@Body() dto: CreateNoteDto) {
    return this.service.create(dto);
  }

  @Get()
  list(@Query('farm') farm?: string, @Query('lot') lot?: string) {
    return this.service.list({ farm, lot });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Get('changes')
  listChanges(
    @Query('since') since: string,
    @Query('farm') farm?: string,
    @Query('lot') lot?: string,
  ) {
    return this.service.listChanges(since, { farm, lot });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.softDelete(id);
    return { success: true };
  }
}
