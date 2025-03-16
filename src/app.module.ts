import { Module } from '@nestjs/common';
import { EnvConfigModule } from './shared/env-config/env-config.module';
import { DatabaseModule } from './shared/database/database.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [EnvConfigModule, DatabaseModule, UsersModule],
})
export class AppModule {}
