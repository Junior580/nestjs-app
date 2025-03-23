import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EnvConfigModule } from '@/shared/infra/env-config/env-config.module';
import { EnvConfigService } from '@/shared/infra/env-config/env-config.service';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';

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
        signOptions: { expiresIn: '60s' },
      }),
      inject: [EnvConfigService],
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, RefreshJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
