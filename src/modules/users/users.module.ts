import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersModule } from '../orders/orders.module';
import { User } from './entities/user.entity';
import { BcryptjsHashProvider } from './hash-provider/bcrypt-hash.provider';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => OrdersModule)],
  controllers: [UsersController],
  providers: [UsersService, BcryptjsHashProvider],
  exports: [UsersService],
})
export class UsersModule {}
