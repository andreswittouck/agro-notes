import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { NotesService, CreateNoteDto } from '../../notes.service';

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
}
