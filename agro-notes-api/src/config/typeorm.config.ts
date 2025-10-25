import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

export const typeOrmConfig = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'agro',
  synchronize: (process.env.TYPEORM_SYNC || 'true') === 'true', // MVP
  logging: (process.env.TYPEORM_LOGGING || 'false') === 'true',
  entities: [join(__dirname, '..', '**', '*.entity.{js,ts}')],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
