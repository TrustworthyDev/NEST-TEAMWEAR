import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_SCHEMA,
  synchronize: false,
  entities: [path.join(__dirname, '**', 'entities/*.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.ts')],
});

// const dataSource = new DataSource({
//   type: 'mysql',
//   host: 'localhost',
//   port: 3306,
//   username: 'root',
//   password: '',
//   database: 'ggteamwear',
//   synchronize: false,
//   entities: [path.join(__dirname, '**', 'entities/*.{ts,js}')],
//   migrations: [path.join(__dirname, 'migrations', '*.ts')],
// });

export default dataSource;
