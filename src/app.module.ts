import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { drizzleProvider } from './drizzle/drizzle.provider';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService2 } from './app.service2';

@Module({
  imports: [DrizzleModule, MailModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, ...drizzleProvider, AppService2],
})
export class AppModule {}
