import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from './infrastructure/persistence/schemas/farm.entity';
import { FarmMember } from './infrastructure/persistence/schemas/farm-member.entity';
import { Note } from '../notes/infrastructure/persistence/schemas/note.entity';
import { FarmsService } from './farms.service';
import { FarmsController } from './interfaces/http/farms.controller';
import { FarmsBootstrap } from './farms.bootstrap';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Farm, FarmMember, Note]), AuthModule],
  controllers: [FarmsController],
  providers: [FarmsService, FarmsBootstrap],
  exports: [FarmsService],
})
export class FarmsModule {}
