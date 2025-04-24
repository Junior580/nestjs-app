import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BcryptjsHashProvider } from '@/shared/infra/providers/hash-provider/bcrypt-hash.provider';

import { CreateUserDto } from './dto/create-user.dto';
import { ListUserDto } from './dto/list-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private hashProvider: BcryptjsHashProvider,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    let newUser: User;

    if (createUserDto.password) {
      const hashPassword = await this.hashProvider.generateHash(
        createUserDto.password,
      );
      newUser = this.userRepository.create({
        ...createUserDto,
        password: hashPassword,
      });
    } else {
      newUser = this.userRepository.create(createUserDto);
    }

    await this.userRepository.save(newUser);

    return newUser;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  async findAll(listUserDto: ListUserDto) {
    const orderByField = listUserDto.sort ?? 'createdAt';
    const orderByDir = listUserDto.sortDir ?? 'ASC';
    const page = Number(
      listUserDto.page && listUserDto.page > 0 ? listUserDto.page : 1,
    );
    const perPage = Number(
      listUserDto.perPage && listUserDto.perPage > 0 ? listUserDto.perPage : 10,
    );

    const count = await this.userRepository.count();

    const users = await this.userRepository.find({
      where: { name: listUserDto.filter },
      order: { [orderByField]: orderByDir },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      items: users,
      total: count,
      currentPage: page,
      perPage,
      sort: orderByField,
      sortDir: orderByDir,
      filter: listUserDto.filter ?? null,
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateHashedRefreshToken(
    id: string,
    hashedRefreshToken: string | null,
  ) {
    return await this.userRepository.update({ id }, { hashedRefreshToken });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const hasValidField = Object.values(updateUserDto).some(
      (value) => value !== null && value !== undefined && value !== '',
    );

    if (!hasValidField) {
      throw new BadRequestException(
        'At least one field must be required for update',
      );
    }
    const user = await this.findOne(id);

    if (updateUserDto.email) {
      const emailExists = await this.userRepository.findOneBy({
        email: updateUserDto.email,
      });

      if (emailExists) {
        throw new ConflictException('Email is already in use');
      }
    }

    await this.userRepository.update(id, {
      ...updateUserDto,
      password: updateUserDto.password
        ? await this.hashProvider.generateHash(updateUserDto.password)
        : user.password,
    });

    return this.userRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    await this.userRepository.remove(user);

    return { message: `User #${id} successfully removed` };
  }
}
