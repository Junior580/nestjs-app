import { DataSource, DataSourceOptions } from 'typeorm';
import { EnvConfigService } from '../env-config/env-config.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../../modules/users/entities/user.entity';

const configService = new EnvConfigService(new ConfigService());

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.getDatabaseHost(),
  port: configService.getDatabasePort(),
  username: configService.getDatabaseUser(),
  password: configService.getDatabasePassword(),
  database: configService.getDatabaseName(),
  synchronize: false,
  entities: [User],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
};

export const connectionSource = new DataSource(dataSourceOptions);
