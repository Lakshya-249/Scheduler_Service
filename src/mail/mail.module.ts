import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ScheduleReminderService } from './mail.service';
import { drizzleProvider } from 'src/drizzle/drizzle.provider';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'ayushdnfd1679@gmail.com',
            pass: 'nbac wuuv vhij smtg',
          },
        },
        defaults: {
          from: '"Lakshya Kumar Singh" <ayushdnfd1679@gmail.com>',
        },
      }),
    }),
  ],
  providers: [ScheduleReminderService, ...drizzleProvider],
  exports: [ScheduleReminderService],
})
export class MailModule {}
