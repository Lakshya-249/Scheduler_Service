import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, sql, lte, gt, or } from 'drizzle-orm';
import * as schema from '../drizzle/schema';
import { MailerService } from '@nestjs-modules/mailer';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

@Injectable()
export class ScheduleReminderService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: PostgresJsDatabase<typeof schema>,
    private readonly mailerService: MailerService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async manageReminders() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];
    console.log(currentTime);

    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourLaterTime = oneHourLater
      .toTimeString()
      .split(' ')[0]
      .slice(0, 5);

    await this.sendReminders(currentDate, currentTime, oneHourLaterTime);
    await this.resetReminders(currentDate, currentTime);
  }

  private async sendReminders(
    currentDate: string,
    currentTime: string,
    oneHourLaterTime: string,
  ) {
    const upcomingEvents = await this.getUpcomingEvents(
      currentDate,
      currentTime,
      oneHourLaterTime,
    );

    for (const event of upcomingEvents) {
      const user = await this.getUser(event.user_id);
      if (user) {
        await this.sendReminderEmail(event, user.email);
        await this.markReminderSent(event.id, true);
      }
    }
  }

  private async resetReminders(currentDate: string, currentTime: string) {
    await this.db
      .update(schema.scheduleStateTable)
      .set({ reminderSent: false })
      .where(
        and(
          eq(schema.scheduleStateTable.reminderSent, true),
          sql`EXISTS (
            SELECT 1 FROM ${schema.scheduleTable}
            WHERE ${schema.scheduleTable.id} = ${schema.scheduleStateTable.schedule_id}
            AND ${schema.scheduleTable.time}::time < ${sql`${currentTime}::time`}
          )`,
        ),
      );
  }

  private async getUpcomingEvents(
    currentDate: string,
    currentTime: string,
    oneHourLaterTime: string,
  ) {
    // Validate time inputs
    if (!currentTime || !oneHourLaterTime) {
      throw new Error('Current time and one hour later time must be provided');
    }

    const [year, month, day] = currentDate.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    return this.db
      .select({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        description: schema.scheduleTable.description,
        time: schema.scheduleTable.time,
        user_id: schema.scheduleTable.user_id,
        isRecurring: schema.scheduleStateTable.isRecurring,
      })
      .from(schema.scheduleTable)
      .innerJoin(
        schema.scheduleStateTable,
        eq(schema.scheduleTable.id, schema.scheduleStateTable.schedule_id),
      )
      .leftJoin(
        schema.recurringScheduleTable,
        eq(schema.scheduleTable.id, schema.recurringScheduleTable.schedule_id),
      )
      .leftJoin(
        schema.schedulesDateTable,
        eq(schema.scheduleTable.id, schema.schedulesDateTable.schedule_id),
      )
      .where(
        and(
          sql`${schema.scheduleTable.time}::time > ${currentTime}::time`,
          sql`${schema.scheduleTable.time}::time <= ${oneHourLaterTime}::time`,
          eq(schema.scheduleStateTable.reminderSent, false),
          eq(schema.scheduleStateTable.isSnoozed, false),
          or(
            and(
              eq(schema.scheduleStateTable.isRecurring, false),
              eq(schema.schedulesDateTable.date, currentDate),
            ),
            and(
              eq(schema.scheduleStateTable.isRecurring, true),
              or(
                eq(schema.recurringScheduleTable.frequency, 'daily'),
                and(
                  eq(schema.recurringScheduleTable.frequency, 'weekly'),
                  sql`EXISTS (
                    SELECT 1 FROM ${schema.days_of_week}
                    WHERE ${schema.days_of_week.day} = ${dayOfWeek}
                  )`,
                ),
                and(
                  eq(schema.recurringScheduleTable.frequency, 'monthly'),
                  sql`EXISTS (
                    SELECT 1 FROM ${schema.dates_of_month}
                    WHERE ${schema.dates_of_month.date} = ${day}
                  )`,
                ),
                and(
                  eq(schema.recurringScheduleTable.frequency, 'yearly'),
                  sql`EXISTS (
                    SELECT 1 FROM ${schema.months_of_year}
                    WHERE ${schema.months_of_year.month} = ${month}
                    AND EXISTS (
                      SELECT 1 FROM ${schema.dates_of_month}
                      WHERE ${schema.dates_of_month.date} = ${day}
                    )
                  )`,
                ),
              ),
            ),
          ),
        ),
      );
  }

  private async getUser(userId: string) {
    const users = await this.db
      .select({
        email: schema.userTable.email,
      })
      .from(schema.userTable)
      .where(eq(schema.userTable.id, userId));

    return users[0];
  }

  private async sendReminderEmail(
    event: {
      id: string;
      title: string;
      description: string;
      time: string;
      user_id: string;
      isRecurring: boolean;
    },
    email: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Upcoming Schedule Reminder',
      text: `Reminder: You have a scheduled event "${event.title}" coming up at ${event.time}.\n\nDescription: ${event.description}`,
    });
  }

  private async markReminderSent(scheduleId: string, sent: boolean) {
    await this.db
      .update(schema.scheduleStateTable)
      .set({ reminderSent: sent })
      .where(eq(schema.scheduleStateTable.schedule_id, scheduleId));
  }
}
