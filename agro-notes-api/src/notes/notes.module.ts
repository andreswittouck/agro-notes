import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from './infrastructure/persistence/schemas/note.entity';
import { NotesService } from './notes.service';
import { NotesController } from './interfaces/http/notes.controller';
import { AuthModule } from '../auth/auth.module';
import { FarmMember } from '../farms/infrastructure/persistence/schemas/farm-member.entity';
import { Farm } from '../farms/infrastructure/persistence/schemas/farm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note, FarmMember, Farm]), AuthModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
