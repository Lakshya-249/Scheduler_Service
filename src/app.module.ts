import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { drizzleProvider } from './drizzle/drizzle.provider';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService2 } from './app.service2';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    DrizzleModule,
    MailModule,
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: 'lakshya', // Use environment variables in production
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AppController, UserController],
  providers: [AppService, ...drizzleProvider, AppService2, UserService],
})
export class AppModule {}
