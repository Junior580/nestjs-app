import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { EnvConfigModule } from '@/shared/infra/env-config/env-config.module';
import { EnvConfigService } from '@/shared/infra/env-config/env-config.service';

import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    EnvConfigModule,
    JwtModule.registerAsync({
      imports: [EnvConfigModule],
      useFactory: (configService: EnvConfigService) => ({
        global: true,
        secret: configService.getJwtSecret(),
        signOptions: { expiresIn: 7200 },
      }),
      inject: [EnvConfigService],
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule { }
