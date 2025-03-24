import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';

import { EnvConfigService } from '../../shared/infra/env-config/env-config.service';
import { UsersService } from '../users/users.service';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import { CurrentUser } from './types/current-user';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: EnvConfigService,
    private usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string): Promise<{ id: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordMatch = await compare(password, user.password);

    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');

    return { id: user.id };
  }

  async login(userId: string) {
    const { accessToken, refreshToken } = await this.generateTokens(userId);

    const hashedRefreshToken = await hash(refreshToken, 6);

    await this.usersService.updateHashedRefreshToken(
      userId,
      hashedRefreshToken,
    );

    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: string) {
    const { accessToken, refreshToken } = await this.generateTokens(userId);

    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async validateJwtUser(userId: string): Promise<CurrentUser> {
    const user = await this.usersService.findOne(userId);

    if (!user) throw new UnauthorizedException('User not found!');

    const currentUser: CurrentUser = {
      id: user.id,
      role: user.role,
    };

    return currentUser;
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Invalid Refresh Token');

    const refreshTokenMatches = await compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!refreshTokenMatches)
      throw new UnauthorizedException('Invalid Refresh Token');

    return { id: userId };
  }

  private async generateTokens(userId: string) {
    const payload: AuthJwtPayload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getJwtSecret(),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getRefreshJwtSecret(),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
