import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { AuthModule } from '../auth/auth.module';
import { ImprovementsModule } from '../improvements/improvements.module';

@Module({
  imports: [AuthModule, ImprovementsModule],
  controllers: [MeController],
})
export class UsersModule {}
