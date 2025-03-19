import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

import { BaseEntity } from '../../../shared/infra/entities/entity';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class Product extends BaseEntity {
  @Column({ name: 'product_name' })
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

  @ManyToMany(() => Order, (order) => order.products)
  @JoinTable({
    name: 'order_products',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'order_id', referencedColumnName: 'id' },
  })
  orders: Order[];
}
