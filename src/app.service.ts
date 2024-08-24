import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './drizzle/schema';
import { DrizzleAsyncProvider } from './drizzle/drizzle.provider';
import { and, desc, eq, lte } from 'drizzle-orm';
import { ScheduleReminderService } from './mail/mail.service';
import {
  schedule,
  schedule2,
  scheduleDate,
  user,
  user2,
  user3,
  state,
  schedule3,
} from './jsonSchemaTypes';
import { table } from 'console';
import { date } from 'drizzle-orm/mysql-core';
import { title } from 'process';

// const now = new Date();
// const currentDate = now.toISOString().split('T')[0];
// const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);
// const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
// const oneHourLaterTime = oneHourLater.toTimeString().split(' ')[0].slice(0, 5);

@Injectable()
export class AppService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createUsers(username: string, email: string): Promise<user> {
    const user = await this.db
      .insert(schema.userTable)
      .values([{ username: username, email: email }])
      .returning({
        id: schema.userTable.id,
        username: schema.userTable.username,
        email: schema.userTable.email,
      });
    return user[0];
  }

  async getschedules(id: string, date: string) {
    const now = new Date();
    const currentDate = date ? date : now.toISOString().split('T')[0];
    const schedules = await this.db
      .select({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        star: schema.scheduleStateTable.star,
        time: schema.scheduleTable.time,
      })
      .from(schema.scheduleTable)
      .innerJoin(
        schema.schedulesDateTable,
        eq(schema.schedulesDateTable.schedule_id, schema.scheduleTable.id),
      )
      .innerJoin(
        schema.scheduleStateTable,
        eq(schema.scheduleStateTable.schedule_id, schema.scheduleTable.id),
      )
      .where(
        and(
          eq(schema.scheduleTable.user_id, id),
          eq(schema.schedulesDateTable.date, currentDate),
        ),
      );
    return schedules;
  }

  async getallSchedule(id: string): Promise<schedule[]> {
    const schedules = await this.db
      .select()
      .from(schema.scheduleTable)
      .where(eq(schema.scheduleTable.user_id, id));
    return schedules;
  }

  async createschedules(schedule: schedule3): Promise<schedule2> {
    const newSchedule = await this.db
      .insert(schema.scheduleTable)
      .values([
        {
          title: schedule.title,
          description: schedule.description,
          time: schedule.time,
          user_id: schedule.user_id,
        },
      ])
      .returning({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        description: schema.scheduleTable.description,
        time: schema.scheduleTable.time,
        user_id: schema.scheduleTable.user_id,
        time_Stamp: schema.scheduleTable.time_Stamp,
      });
    type ndate = {
      date: string;
      schedule_id: string;
    };
    const alldates: ndate[] = [];
    for (const mdate of schedule.date_s) {
      alldates.push({ date: mdate, schedule_id: newSchedule[0].id });
    }
    const dates = await this.db
      .insert(schema.schedulesDateTable)
      .values(alldates)
      .returning({
        id: schema.schedulesDateTable.id,
        date: schema.schedulesDateTable.date,
        schedule_id: schema.schedulesDateTable.schedule_id,
      });
    const state = await this.db
      .insert(schema.scheduleStateTable)
      .values([
        {
          star: schedule.star,
          isRecurring: schedule.isReccuring,
          schedule_id: newSchedule[0].id,
        },
      ])
      .returning({
        id: schema.scheduleStateTable.id,
        star: schema.scheduleStateTable.star,
        isRecurring: schema.scheduleStateTable.isRecurring,
        isSnoozed: schema.scheduleStateTable.isSnoozed,
        schedule_id: schema.scheduleStateTable.schedule_id,
      });
    return { ...newSchedule[0], dates: dates, state: state[0] };
  }

  async mydate() {
    const now = new Date();
    return now;
  }

  async getImportantSchedules(id: string, date: string) {
    const now = new Date();
    const currentDate = date ? date : now.toISOString().split('T')[0];

    const schedules = await this.db
      .select({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        time: schema.scheduleTable.time,
        star: schema.scheduleStateTable.star,
      })
      .from(schema.scheduleTable)
      .innerJoin(
        schema.scheduleStateTable,
        eq(schema.scheduleTable.id, schema.scheduleStateTable.schedule_id),
      )
      .innerJoin(
        schema.schedulesDateTable,
        eq(schema.scheduleTable.id, schema.schedulesDateTable.schedule_id),
      )
      .where(
        and(
          eq(schema.scheduleTable.user_id, id),
          eq(schema.scheduleStateTable.star, true),
          lte(schema.schedulesDateTable.date, currentDate),
        ),
      );

    return schedules;
  }

  async updateSchedule(schedule: Partial<schedule3>): Promise<schedule2> {
    // Update the main schedule
    const updatedSchedule = await this.db
      .update(schema.scheduleTable)
      .set({
        title: schedule.title,
        description: schedule.description,
        time: schedule.time,
        // We don't update user_id as it shouldn't change
      })
      .where(eq(schema.scheduleTable.id, schedule.id))
      .returning({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        description: schema.scheduleTable.description,
        time: schema.scheduleTable.time,
        user_id: schema.scheduleTable.user_id,
        time_Stamp: schema.scheduleTable.time_Stamp,
      });

    await this.db
      .delete(schema.recurringScheduleTable)
      .where(eq(schema.recurringScheduleTable.schedule_id, schedule.id));

    // Update dates if provided
    let dates = [];
    if (schedule.date_s.length > 0) {
      // First, delete existing dates
      await this.db
        .delete(schema.schedulesDateTable)
        .where(eq(schema.schedulesDateTable.schedule_id, schedule.id));

      // Then insert new dates
      const newDates = schedule.date_s.map((date) => ({
        date,
        schedule_id: schedule.id,
      }));
      dates = await this.db
        .insert(schema.schedulesDateTable)
        .values(newDates)
        .returning({
          id: schema.schedulesDateTable.id,
          date: schema.schedulesDateTable.date,
          schedule_id: schema.schedulesDateTable.schedule_id,
        });
    }

    // Update state if provided
    let state = [];
    if (schedule.star !== undefined || schedule.isReccuring !== undefined) {
      state = await this.db
        .update(schema.scheduleStateTable)
        .set({
          star: schedule.star,
          isRecurring: schedule.isReccuring,
        })
        .where(eq(schema.scheduleStateTable.schedule_id, schedule.id))
        .returning({
          id: schema.scheduleStateTable.id,
          star: schema.scheduleStateTable.star,
          isRecurring: schema.scheduleStateTable.isRecurring,
          schedule_id: schema.scheduleStateTable.schedule_id,
        });
    }

    return { ...updatedSchedule[0], dates, state: state[0] };
  }

  async setStar(id: string) {
    const state = await this.db
      .update(schema.scheduleStateTable)
      .set({
        star: true,
      })
      .where(eq(schema.scheduleStateTable.schedule_id, id))
      .returning({
        id: schema.scheduleStateTable.id,
        star: schema.scheduleStateTable.star,
        isRecurring: schema.scheduleStateTable.isRecurring,
        schedule_id: schema.scheduleStateTable.schedule_id,
      });
    return state[0];
  }

  async setSnoozeSchedule(id: string, val: string) {
    const setval = val === 'false' ? { isSnoozed: false } : { isSnoozed: true };
    const state = await this.db
      .update(schema.scheduleStateTable)
      .set(setval)
      .where(eq(schema.scheduleStateTable.schedule_id, id))
      .returning({
        id: schema.scheduleStateTable.id,
        star: schema.scheduleStateTable.star,
        isRecurring: schema.scheduleStateTable.isRecurring,
        isSnoozed: schema.scheduleStateTable.isSnoozed,
        schedule_id: schema.scheduleStateTable.schedule_id,
      });
    return state[0];
  }

  async recentSchedules(id: string): Promise<schedule[]> {
    const schedules = await this.db
      .select()
      .from(schema.scheduleTable)
      .where(eq(schema.scheduleTable.user_id, id))
      .limit(10)
      .orderBy(desc(schema.scheduleTable.time_Stamp));
    return schedules;
  }

  async snoozedSchedules(id: string): Promise<schedule[]> {
    const schedules = await this.db
      .select({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        description: schema.scheduleTable.description,
        time: schema.scheduleTable.time,
        time_Stamp: schema.scheduleTable.time_Stamp,
        user_id: schema.scheduleTable.user_id,
      })
      .from(schema.scheduleTable)
      .innerJoin(
        schema.scheduleStateTable,
        eq(schema.scheduleTable.id, schema.scheduleStateTable.schedule_id),
      )
      .where(
        and(
          eq(schema.scheduleStateTable.isSnoozed, true),
          eq(schema.scheduleTable.user_id, id),
        ),
      );
    return schedules;
  }

  async deleteSchedule(id: string): Promise<Object> {
    await this.db
      .delete(schema.scheduleTable)
      .where(eq(schema.scheduleTable.id, id));
    return { message: 'schedule deleted successfully', success: true };
  }
}
