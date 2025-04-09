import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { ListUserDto } from './dto/list-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        email: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email conflict',
  })
  @ApiResponse({
    status: 422,
    description: 'Request body with invalid data',
  })
  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User list',
    schema: {
      type: 'array',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '6d0e19cd-65db-4139-83e8-3d6f486c9fb2',
        },
        name: { type: 'string', example: 'user2' },
        email: { type: 'string', format: 'email', example: 'user2@email.com' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Get()
  findAll(@Query() listUserDto: ListUserDto) {
    return this.usersService.findAll(listUserDto);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Get user',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Get(':id')
  findOne(@Param() param: GetUserDto) {
    return this.usersService.findOne(param.id);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 204,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 422,
    description: 'Request body with invalid data',
  })
  @HttpCode(204)
  @Patch(':id')
  update(@Param() param: GetUserDto, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(param.id, updateUserDto);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User deleted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User successfully removed',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Delete(':id')
  remove(@Param() param: GetUserDto) {
    return this.usersService.remove(param.id);
  }
}
