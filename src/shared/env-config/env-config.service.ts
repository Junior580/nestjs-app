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

  getDatabaseHost(): string {
    return String(this.configService.get<string>('DATABASE_HOST'));
  }

  getDatabasePort(): number {
    return Number(this.configService.get<number>('DATABASE_PORT'));
  }

  getDatabaseUser(): string {
    return String(this.configService.get<string>('DATABASE_USER'));
  }

  getDatabasePassword(): string {
    return String(this.configService.get<string>('DATABASE_PASSWORD'));
  }

  getDatabaseName(): string {
    return String(this.configService.get<string>('DATABASE_NAME'));
  }
}
