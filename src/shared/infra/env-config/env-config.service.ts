import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfigService {
  constructor(private configService: ConfigService) {}

  getNodeEnv(): string {
    return String(this.configService.get<string>('NODE_ENV'));
  }

  getAppPort(): number {
    return Number(this.configService.get<number>('PORT'));
  }

  getJwtSecret(): string {
    return String(this.configService.get<string>('JWT_SECRET'));
  }

  getRefreshJwtSecret(): string {
    return String(this.configService.get<string>('REFRESH_JWT_SECRET'));
  }

  getDatabaseUrl(): string {
    return String(this.configService.get<string>('DATABASE_URL'));
  }
}
