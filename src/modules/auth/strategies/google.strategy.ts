import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

import { EnvConfigService } from '@/shared/infra/env-config/env-config.service';

import { AuthService } from '../auth.service';
import { AuthProvider } from '../types/auth-provider';
import { GoogleProfile } from '../types/google-profile';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    envConfig: EnvConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: envConfig.getGoogleClientId(),
      clientSecret: envConfig.getGoogleSecret(),
      callbackURL: envConfig.getGoogleCallbackUrl(),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ) {
    const user = await this.authService.validateGoogleUser({
      name: `${profile.displayName}`,
      email: profile.emails[0].value,
      provider: AuthProvider.GOOGLE,
    });
    done(null, user);
    return user;
  }
}
