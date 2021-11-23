import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';
const dbConfig = config.get('db');

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: dbConfig.type,
    host: process.env.DB_URL || dbConfig.host,
    port: process.env.DB_PORT || dbConfig.port,
    username: process.env.DB_USER || dbConfig.username,
    password: process.env.DB_PWD || dbConfig.password,
    database: process.env.DB_NAME || dbConfig.database,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: process.env.TYPEORM_SYNC || dbConfig.synchronize,
};

console.log(typeOrmConfig);