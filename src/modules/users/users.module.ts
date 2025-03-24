import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BcryptjsHashProvider } from '@/shared/infra/providers/hash-provider/bcrypt-hash.provider';

import { OrdersModule } from '../orders/orders.module';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => OrdersModule)],
  controllers: [UsersController],
  providers: [UsersService, BcryptjsHashProvider],
  exports: [UsersService],
})
export class UsersModule {}
