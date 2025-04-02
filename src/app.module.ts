import { Module } from '@nestjs/common';

import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './shared/infra/database/database.module';
import { EnvConfigModule } from './shared/infra/env-config/env-config.module';
import { HashProviderModule } from './shared/infra/providers/hash-provider/hash-provider.module';

@Module({
  imports: [
    EnvConfigModule,
    DatabaseModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    AuthModule,
    HashProviderModule,
  ],
})
export class AppModule {}
