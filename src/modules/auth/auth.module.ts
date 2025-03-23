import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EnvConfigModule } from '@/shared/infra/env-config/env-config.module';
import { EnvConfigService } from '@/shared/infra/env-config/env-config.service';

import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';

@Global()
@Module({
  imports: [
    EnvConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [EnvConfigModule],
      useFactory: (configService: EnvConfigService) => ({
        global: true,
        secret: configService.getJwtSecret(),
        signOptions: { expiresIn: 7200 },
      }),
      inject: [EnvConfigService],
    }),
    PassportModule,
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
