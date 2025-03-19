import { Module } from '@nestjs/common';

import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './shared/database/database.module';
import { EnvConfigModule } from './shared/env-config/env-config.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [EnvConfigModule, DatabaseModule, UsersModule, ProductsModule, OrdersModule],
})
export class AppModule { }
