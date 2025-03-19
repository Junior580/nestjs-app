import { Exclude } from 'class-transformer';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../shared/infra/entities/entity';

@Entity()
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;
}
