import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';

import { AuthProvider } from '../../../modules/auth/types/auth-provider';
import { BaseEntity } from '../../../shared/infra/entities/entity';
import { Role } from '../../auth/types/current-user';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ type: 'text', nullable: true })
  hashedRefreshToken: string | null;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @OneToMany(() => Order, (order) => order.user, { cascade: true })
  orders: Order[];
}
