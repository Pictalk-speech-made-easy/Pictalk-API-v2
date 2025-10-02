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
    extra: {
        max: 25,                        // Maximum pool size
        idleTimeoutMillis: 30000,       // Close idle clients after 30s
        connectionTimeoutMillis: 10000, // Timeout if can't get connection
        statement_timeout: 60000,       // Kill queries after 60s
    },
};

console.log(typeOrmConfig);