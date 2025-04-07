import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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
  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('signin')
  signin(@Req() req: Request) {
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
  refreshToken(@Req() req: Request) {
    return this.authService.refreshToken(req.user.id);
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
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
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('signout')
  async signOut(@Req() req: Request) {
    await this.authService.signOut(req.user.id);
  }

  @ApiResponse({
    status: 201,
    description: 'Auth user using google for web',
  })
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/signin')
  async googleSignin() { }

  @ApiResponse({
    status: 201,
    description: 'Google callback url',
  })
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: Request) {
    return this.authService.login(req.user.id);
  }
}
