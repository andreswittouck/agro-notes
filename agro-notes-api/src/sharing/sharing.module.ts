import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmShare } from './infrastructure/persistence/schemas/farm-share.entity';
import { SharingService } from './sharing.service';
import { SharingController } from './interfaces/http/sharing.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([FarmShare]), AuthModule],
  controllers: [SharingController],
  providers: [SharingService],
  exports: [SharingService],
})
export class SharingModule {}
