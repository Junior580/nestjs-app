import { Module } from '@nestjs/common';

import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './shared/database/database.module';
import { EnvConfigModule } from './shared/env-config/env-config.module';

@Module({
  imports: [EnvConfigModule, DatabaseModule, UsersModule],
})
export class AppModule {}
