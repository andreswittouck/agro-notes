import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from './infrastructure/persistence/schemas/note.entity';
import { NotesService } from './notes.service';
import { NotesController } from './interfaces/http/notes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Note])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
