import { AuthProvider } from '../../../modules/auth/types/auth-provider';
import { Role } from '../../../modules/auth/types/current-user';
import { Product } from '../../../modules/products/entities/product.entity';
import { User } from '../../../modules/users/entities/user.entity';
import { BcryptjsHashProvider } from '../providers/hash-provider/bcrypt-hash.provider';
import { AppDataSource } from './typeorm.config';

const hash = new BcryptjsHashProvider();

async function seed() {
  const start = new Date();
  console.log(`Starting seeding...`);
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);

  console.log(`Seeding users table...`);

  const users = [
    {
      name: 'Admin',
      email: 'admin@email.com',
      password: await hash.generateHash('test123'),
      role: Role.ADMIN,
      provider: AuthProvider.LOCAL,
    },
    {
      name: 'user1',
      email: 'user1@email.com',
      password: await hash.generateHash('test123'),
      role: Role.USER,
    },
    {
      name: 'user2',
      email: 'user2@email.com',
      password: await hash.generateHash('test123'),
      role: Role.EDITOR,
    },
  ];

  await userRepo.save(users);

  console.log(`Seeding products table...`);

  const products = [
    {
      productName: 'RGB Gaming Mouse',
      description:
        'Ergonomic mouse with RGB lighting and 6 programmable buttons.',
      price: 129.99,
      quantityInStock: 50,
      imageUrl: 'https://example.com/images/gaming-mouse.jpg',
      rating: 4.5,
    },
    {
      productName: 'Blue Mechanical Keyboard',
      description: 'Mechanical keyboard with blue switches and aluminum frame.',
      price: 249.9,
      quantityInStock: 30,
      imageUrl: 'https://example.com/images/mechanical-keyboard.jpg',
      rating: 4.7,
    },
    {
      productName: '27" 144Hz Monitor',
      description: '27-inch Full HD monitor with 144Hz refresh rate.',
      price: 1399.0,
      quantityInStock: 20,
      imageUrl: 'https://example.com/images/144hz-monitor.jpg',
      rating: 4.8,
    },
  ];

  await productRepo.save(products);
  const end = new Date();
  console.log(
    `✅ ~ Seed successfully completed in ${Number(end) - Number(start)}ms`,
  );
  await AppDataSource.destroy();
}

seed().catch(async (err) => {
  console.error('❌ ~ Error running seed:', err);
  await AppDataSource.destroy();
});
