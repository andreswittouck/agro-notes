import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Improvement } from './infrastructure/persistence/schemas/improvement.entity';
import { ImprovementViewer } from './infrastructure/persistence/schemas/improvement-viewer.entity';
import { ImprovementsService } from './improvements.service';
import { ImprovementViewersService } from './improvement-viewers.service';
import { ImprovementsController } from './interfaces/http/improvements.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Improvement, ImprovementViewer]),
    AuthModule,
  ],
  controllers: [ImprovementsController],
  providers: [ImprovementsService, ImprovementViewersService],
  exports: [ImprovementViewersService],
})
export class ImprovementsModule {}
