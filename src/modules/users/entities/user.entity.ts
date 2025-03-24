import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../shared/infra/entities/entity';
import { Role } from '../../auth/types/current-user';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ nullable: true })
  hashedRefreshToken: string;

  @OneToMany(() => Order, (order) => order.user, { cascade: true })
  orders: Order[];
}
