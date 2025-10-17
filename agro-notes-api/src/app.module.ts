import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [TypeOrmModule.forRootAsync({ useFactory: () => typeOrmConfig() }), NotesModule],
})
export class AppModule {}
