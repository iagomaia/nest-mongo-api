import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as config from 'config';
import * as winston from 'winston';

const getLoggerConfig = (level: string) =>
  ({
    development: 'verbose',
    production: 'http',
  }[level]);

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    levels: winston.config.npm.levels,
    level: getLoggerConfig(process.env.NODE_ENV),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          nestWinstonModuleUtilities.format.nestLike(),
        ),
      }),
      new winston.transports.File({
        filename: 'application.log',
        dirname: 'logs',
      }),
    ],
  });
  logger.log(` Initializing bootstrap...`, 'bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger,
  });
  const port = config.get('server.port');
  await app.listen(port);
  logger.log(` Server started on port ${port}`, 'bootstrap');
}

bootstrap();
