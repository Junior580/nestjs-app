import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { EnvConfigService } from './env-config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('dev'),
        PORT: Joi.number().port().default(3000),
        JWT_SECRET: Joi.string().uuid(),
        REFRESH_JWT_SECRET: Joi.string().uuid(),
        DATABASE_URL: Joi.string().uri(),
        GOOGLE_CLIENT_ID: Joi.string(),
        GOOGLE_SECRET: Joi.string(),
        GOOGLE_CALLBACK_URL: Joi.string().uri(),
      }),
    }),
  ],
  providers: [EnvConfigService],
  exports: [EnvConfigService],
})
export class EnvConfigModule {}
