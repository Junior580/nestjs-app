import { Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: FastifyRequest) {
    return req.user;
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: FastifyRequest) {
    return this.authService.login(req.user.id);
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  refreshToken(@Req() req: FastifyRequest) {
    return this.authService.refreshToken(req.user.id);
  }
}
