import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { BcryptjsHashProvider } from './hash-provider/bcrypt-hash.provider';
import { SignInDto } from './dto/signin-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private hashProvider: BcryptjsHashProvider,
  ) {}

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

  async findAll() {
    return this.userRepository.find();
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

    await this.userRepository.update(id, {
      ...updateUserDto,
      password: updateUserDto.password
        ? await this.hashProvider.generateHash(updateUserDto.password)
        : user.id,
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
