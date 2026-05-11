// agro-notes-api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthorizedUsersService } from './authorized-users.service';
import { AdminUsersService } from './admin-users.service';

@Module({
  providers: [AuthGuard, AuthorizedUsersService, AdminUsersService],
  exports: [AuthGuard, AuthorizedUsersService, AdminUsersService],
})
export class AuthModule {}
