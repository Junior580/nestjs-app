import { Column, Entity, ManyToMany } from 'typeorm';

import { BaseEntity } from '../../../shared/infra/entities/entity';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class Product extends BaseEntity {
  @Column({ name: 'product_name', unique: true })
  productName: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'quantity_in_stock', type: 'int' })
  quantityInStock: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'float', nullable: true })
  rating?: number;

  @ManyToMany(() => Order, (order) => order.products, { onDelete: 'CASCADE' })
  orders: Order[];
}
