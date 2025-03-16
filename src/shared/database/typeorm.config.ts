import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

import { User } from '../../modules/users/entities/user.entity';
import { EnvConfigService } from '../env-config/env-config.service';

const configService = new EnvConfigService(new ConfigService());

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.getDatabaseHost(),
  port: configService.getDatabasePort(),
  username: configService.getDatabaseUser(),
  password: configService.getDatabasePassword(),
  database: configService.getDatabaseName(),
  synchronize: false,
  logging: configService.getNodeEnv() == 'dev' ? true : false,
  entities: [User],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
};

export const AppDataSource = new DataSource(dataSourceOptions);
