import { Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
    status: 201,
    description: 'Auth user',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        role: {
          type: 'string',
          enum: ['ADMIN', 'USER', 'EDITOR'],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Get('profile')
  getProfile(@Request() req: FastifyRequest) {
    return req.user;
  }

  @ApiResponse({
    status: 201,
    description: 'Auth user',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        accessToken: {
          type: 'string',
        },
        refreshToken: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials',
  })
  // @ApiResponse({
  //   status: 422,
  //   description: 'Request body with invalid data',
  // })
  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('signin')
  signin(@Request() req: FastifyRequest) {
    return this.authService.login(req.user.id);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Refresh token',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        accessToken: {
          type: 'string',
        },
        refreshToken: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(RefreshAuthGuard)
  @Public()
  @Post('refresh')
  refreshToken(@Req() req: FastifyRequest) {
    return this.authService.refreshToken(req.user.id);
  }
}
