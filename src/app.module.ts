import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './configs/typeorm.config';
import { UserModule } from './users/users.module';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { AuthModule } from './auth/auth.module';
import * as winston from 'winston';
import * as config from 'config';
import { LoggerInterceptor } from './auth/logger.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HandlebarsAdapter, MailerModule } from '@nest-modules/mailer';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    WinstonModule.forRoot({
      levels: winston.config.npm.levels,
      level: 'verbose',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike(),
          ),
        }),
        new winston.transports.File({
          level: 'verbose',
          filename: 'application.log',
          dirname: 'logs',
        }),
      ],
    }),
    MailerModule.forRoot({
      template: {
        dir: path.resolve(__dirname, '..', 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          defaultLayout: 'template',
          partialsDir: path.resolve(__dirname, '..', 'templates/partials'),
          extName: '.hbs',
          layoutsDir: path.resolve(__dirname, '..', 'templates'),
        },
      },
      transport: `smtps://${config.mail.user}:${config.mail.password}@${config.mail.host}`,
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
})
export class AppModule {}
