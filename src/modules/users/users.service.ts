import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { ListUserDto } from './dto/list-user.dto';
import { SignInDto } from './dto/signin-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { BcryptjsHashProvider } from './hash-provider/bcrypt-hash.provider';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private hashProvider: BcryptjsHashProvider,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const hashPassword = await this.hashProvider.generateHash(
      createUserDto.password,
    );

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashPassword,
    });

    await this.userRepository.save(newUser);

    return newUser;
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const hashPasswordMatches = await this.hashProvider.compareHash(
      password,
      user.password,
    );

    if (!hashPasswordMatches) {
      throw new BadRequestException('Invalid credentials');
    }

    return user;
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const hasValidField = Object.values(updateUserDto).some(
      (value) => value !== null && value !== undefined && value !== '',
    );

    if (!hasValidField) {
      throw new BadRequestException(
        'At least one field must be required for update',
      );
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

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
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);

    return { message: `User #${id} successfully removed` };
  }
}
