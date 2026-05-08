import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { NotesModule } from './notes/notes.module';
import { AuthModule } from './auth/auth.module';
import { SharingModule } from './sharing/sharing.module';
import { UsersModule } from './users/users.module';
import { FarmsModule } from './farms/farms.module';
import { ImprovementsModule } from './improvements/improvements.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: () => typeOrmConfig() }),
    AuthModule,
    NotesModule,
    SharingModule,
    ImprovementsModule,
    UsersModule,
    FarmsModule,
  ],
})
export class AppModule {}
