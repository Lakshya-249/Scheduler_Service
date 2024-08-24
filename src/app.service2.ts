import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DrizzleAsyncProvider } from './drizzle/drizzle.provider';
import * as schema from './drizzle/schema';
import { and, eq, isNotNull, isNull, ne } from 'drizzle-orm';
import { schedule, schedule3 } from './jsonSchemaTypes';

@Injectable()
export class AppService2 {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: PostgresJsDatabase<typeof schema>,
  ) {}
  async getrecurringSchedules(id: string, date: string, star?: boolean) {
    const now = new Date();
    const currentDate = date ? date : now.toISOString().split('T')[0];
    const [a, b, c] = currentDate.split('-');
    const year = a.length === 4 ? parseInt(a) : parseInt(c);
    const month = parseInt(b);
    const day = c.length <= 2 ? parseInt(c) : parseInt(a);
    const datenow = new Date(year, month - 1, day);

    // Create a base condition
    const baseCondition = and(
      eq(schema.scheduleTable.user_id, id),
      eq(schema.recurringScheduleTable.frequency, 'daily'),
    );

    // Add star condition if provided
    const starCondition =
      star !== undefined ? eq(schema.scheduleStateTable.star, star) : undefined;

    // Combine conditions
    const whereCondition = starCondition
      ? and(baseCondition, starCondition)
      : baseCondition;

    const dailySchedules = await this.db
      .select({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        time: schema.scheduleTable.time,
        star: schema.scheduleStateTable.star,
      })
      .from(schema.scheduleTable)
      .innerJoin(
        schema.recurringScheduleTable,
        eq(schema.scheduleTable.id, schema.recurringScheduleTable.schedule_id),
      )
      .innerJoin(
        schema.scheduleStateTable,
        eq(schema.scheduleStateTable.schedule_id, schema.scheduleTable.id),
      )
      .where(whereCondition);

    const weekyschedules = await this.getWeeklySchedules(
      id,
      datenow.getDay(),
      star,
    );
    const monthlySchedules = await this.getMonthlySchedules(id, day, star);
    const yearlySchedules = await this.getYearlySchedules(id, month, day, star);

    console.log(year, month, day, datenow.getDay());
    return [
      ...dailySchedules,
      ...weekyschedules,
      ...monthlySchedules,
      ...yearlySchedules,
    ];
  }

  async getWeeklySchedules(id: string, day: number, star?: boolean) {
    const baseCondition = and(
      eq(schema.scheduleTable.user_id, id),
      eq(schema.recurringScheduleTable.frequency, 'weekly'),
      eq(schema.days_of_week.day, day),
    );

    const starCondition =
      star !== undefined ? eq(schema.scheduleStateTable.star, star) : undefined;

    const whereCondition = starCondition
      ? and(baseCondition, starCondition)
      : baseCondition;

    const weeklySchedules = await this.db
      .select({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        time: schema.scheduleTable.time,
        star: schema.scheduleStateTable.star,
      })
      .from(schema.scheduleTable)
      .innerJoin(
        schema.recurringScheduleTable,
        eq(schema.scheduleTable.id, schema.recurringScheduleTable.schedule_id),
      )
      .innerJoin(
        schema.days_of_week,
        eq(schema.scheduleTable.id, schema.days_of_week.schedule_id),
      )
      .innerJoin(
        schema.scheduleStateTable,
        eq(schema.scheduleStateTable.schedule_id, schema.scheduleTable.id),
      )
      .where(whereCondition);

    console.log(weeklySchedules);
    return weeklySchedules;
  }

  async getMonthlySchedules(id: string, date: number, star?: boolean) {
    const baseCondition = and(
      eq(schema.scheduleTable.user_id, id),
      eq(schema.recurringScheduleTable.frequency, 'monthly'),
      eq(schema.dates_of_month.date, date),
      isNull(schema.dates_of_month.month_of_year),
    );

    const starCondition =
      star !== undefined ? eq(schema.scheduleStateTable.star, star) : undefined;

    const whereCondition = starCondition
      ? and(baseCondition, starCondition)
      : baseCondition;

    const monthlySchedules = await this.db
      .select({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        time: schema.scheduleTable.time,
        star: schema.scheduleStateTable.star,
      })
      .from(schema.scheduleTable)
      .innerJoin(
        schema.recurringScheduleTable,
        eq(schema.scheduleTable.id, schema.recurringScheduleTable.schedule_id),
      )
      .innerJoin(
        schema.scheduleStateTable,
        eq(schema.scheduleStateTable.schedule_id, schema.scheduleTable.id),
      )
      .innerJoin(
        schema.dates_of_month,
        eq(schema.scheduleTable.id, schema.dates_of_month.schedule_id),
      )
      .where(whereCondition);

    return monthlySchedules;
  }

  async getYearlySchedules(
    id: string,
    month: number,
    date: number,
    star?: boolean,
  ) {
    const baseCondition = and(
      eq(schema.scheduleTable.user_id, id),
      eq(schema.recurringScheduleTable.frequency, 'yearly'),
      eq(schema.months_of_year.month, month),
      isNotNull(schema.dates_of_month.month_of_year),
      eq(schema.dates_of_month.date, date),
    );

    const starCondition =
      star !== undefined ? eq(schema.scheduleStateTable.star, star) : undefined;

    const whereCondition = starCondition
      ? and(baseCondition, starCondition)
      : baseCondition;

    const yearlySchedules = await this.db
      .select({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        time: schema.scheduleTable.time,
        star: schema.scheduleStateTable.star,
      })
      .from(schema.scheduleTable)
      .innerJoin(
        schema.recurringScheduleTable,
        eq(schema.scheduleTable.id, schema.recurringScheduleTable.schedule_id),
      )
      .innerJoin(
        schema.scheduleStateTable,
        eq(schema.scheduleStateTable.schedule_id, schema.scheduleTable.id),
      )
      .innerJoin(
        schema.months_of_year,
        eq(schema.scheduleTable.id, schema.months_of_year.schedule_id),
      )
      .innerJoin(
        schema.dates_of_month,
        eq(schema.dates_of_month.month_of_year, schema.months_of_year.id),
      )
      .where(whereCondition);

    console.log(yearlySchedules);
    return yearlySchedules;
  }

  async createRecurringSchedule(schedule: schedule3) {
    const val = [];
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
    val.push(newSchedule[0]);
    await this.db.insert(schema.scheduleStateTable).values([
      {
        star: schedule.star,
        isRecurring: schedule.isReccuring,
        schedule_id: newSchedule[0].id,
      },
    ]);
    const newval = await this.addrecurrscheduleTable(
      newSchedule[0].id,
      schedule,
    );
    return [...val, ...newval];
  }

  async getScheduleDetail(id: string) {
    const schedule = await this.db
      .select({
        id: schema.scheduleTable.id,
        title: schema.scheduleTable.title,
        description: schema.scheduleTable.description,
        time: schema.scheduleTable.time,
        user_id: schema.scheduleTable.user_id,
        star: schema.scheduleStateTable.star,
        isReccuring: schema.scheduleStateTable.isRecurring,
        isSnoozed: schema.scheduleStateTable.isSnoozed,
        time_Stamp: schema.scheduleTable.time_Stamp,
      })
      .from(schema.scheduleTable)
      .innerJoin(
        schema.scheduleStateTable,
        eq(schema.scheduleStateTable.schedule_id, schema.scheduleTable.id),
      )
      .where(eq(schema.scheduleTable.id, id));
    return schedule[0];
  }

  async updateRecurrSchedule(schedule: schedule3) {
    const val = [];
    const updatedsch = await this.db
      .update(schema.scheduleTable)
      .set({
        title: schedule.title,
        description: schedule.description,
        time: schedule.time,
      })
      .where(eq(schema.scheduleTable.id, schedule.id));
    // val.push(updatedsch[0]);
    let state = [];
    console.log(schedule.id);

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
    val.push(state[0]);
    await this.db
      .delete(schema.schedulesDateTable)
      .where(eq(schema.schedulesDateTable.schedule_id, schedule.id));

    if (schedule.days.length > 0) {
      await this.db
        .delete(schema.days_of_week)
        .where(eq(schema.days_of_week.schedule_id, schedule.id));
    }
    if (schedule.dates.length > 0) {
      await this.db
        .delete(schema.dates_of_month)
        .where(eq(schema.dates_of_month.schedule_id, schedule.id));
    }
    if (schedule.months.length > 0) {
      await this.db
        .delete(schema.months_of_year)
        .where(eq(schema.months_of_year.schedule_id, schedule.id));
    }
    const newval = await this.addrecurrscheduleTable(schedule.id, schedule);
    return [...val, ...newval];
  }

  async addrecurrscheduleTable(id: string, schedule: schedule3) {
    const val = [];

    const getrecurr = await this.db
      .select()
      .from(schema.recurringScheduleTable)
      .where(eq(schema.recurringScheduleTable.schedule_id, id));

    let recurrschedule = [];
    if (getrecurr.length === 0) {
      recurrschedule =
        schedule.frequency === undefined
          ? await this.db
              .insert(schema.recurringScheduleTable)
              .values([
                {
                  schedule_id: id,
                  interval: schedule.interval,
                },
              ])
              .returning({
                id: schema.recurringScheduleTable.id,
                frequency: schema.recurringScheduleTable.frequency,
                interval: schema.recurringScheduleTable.interval,
                start_date: schema.recurringScheduleTable.start_date,
              })
          : await this.db
              .insert(schema.recurringScheduleTable)
              .values([
                {
                  schedule_id: id,
                  frequency: schedule.frequency,
                  interval: schedule.interval,
                },
              ])
              .returning({
                id: schema.recurringScheduleTable.id,
                frequency: schema.recurringScheduleTable.frequency,
                interval: schema.recurringScheduleTable.interval,
                start_date: schema.recurringScheduleTable.start_date,
              });
    } else {
      recurrschedule = await this.db
        .update(schema.recurringScheduleTable)
        .set({
          frequency: schedule.frequency,
          interval: schedule.interval,
        })
        .where(eq(schema.recurringScheduleTable.schedule_id, id))
        .returning({
          id: schema.recurringScheduleTable.id,
          frequency: schema.recurringScheduleTable.frequency,
          interval: schema.recurringScheduleTable.interval,
          start_date: schema.recurringScheduleTable.start_date,
        });
    }
    val.push(recurrschedule[0]);

    const recurrId: string = recurrschedule[0].id;

    if (schedule.frequency === 'weekly') {
      type nweek = {
        day: number;
        schedule_id: string;
        recurring_id: string;
      };
      const weekdays: nweek[] = [];
      for (const day of schedule.days) {
        weekdays.push({
          day: day,
          schedule_id: id,
          recurring_id: recurrId,
        });
      }
      const weeksch = await this.db
        .insert(schema.days_of_week)
        .values(weekdays)
        .returning({
          id: schema.days_of_week.id,
          days: schema.days_of_week.day,
          schedule_id: schema.days_of_week.schedule_id,
          recurrschedule_id: schema.days_of_week.recurring_id,
        });
      val.push(weeksch);
    } else if (schedule.frequency === 'monthly') {
      type nmonth = {
        date: number;
        schedule_id: string;
        recurring_id: string;
      };
      const months: nmonth[] = [];
      for (const date of schedule.dates) {
        months.push({
          date: date,
          schedule_id: id,
          recurring_id: recurrId,
        });
      }
      const monthsch = await this.db
        .insert(schema.dates_of_month)
        .values(months)
        .returning({
          id: schema.dates_of_month.id,
          dates: schema.dates_of_month.date,
          schedule_id: schema.dates_of_month.schedule_id,
          recurrschedule_id: schema.dates_of_month.recurring_id,
        });
      val.push(monthsch);
    } else if (schedule.frequency === 'yearly') {
      type nmonth = {
        month: number;
        schedule_id: string;
        recurring_id: string;
      };
      const months: nmonth[] = [];
      for (const month of schedule.months) {
        months.push({
          month: month,
          schedule_id: id,
          recurring_id: recurrId,
        });
      }
      const monthsch = await this.db
        .insert(schema.months_of_year)
        .values(months)
        .returning({
          id: schema.months_of_year.id,
          month: schema.months_of_year.month,
          schedule_id: schema.months_of_year.schedule_id,
          recurrschedule_id: schema.months_of_year.recurring_id,
        });
      val.push(monthsch);
      type nmonth2 = {
        date: number;
        schedule_id: string;
        recurring_id: string;
        month_of_year: string;
      };
      const months2: nmonth2[] = [];
      for (const newmonth of monthsch) {
        for (const schd of schedule.dates) {
          months2.push({
            date: schd,
            schedule_id: id,
            recurring_id: recurrId,
            month_of_year: newmonth.id,
          });
        }
      }
      const monthsch2 = await this.db
        .insert(schema.dates_of_month)
        .values(months2)
        .returning({
          id: schema.dates_of_month.id,
          dates: schema.dates_of_month.date,
          schedule_id: schema.dates_of_month.schedule_id,
          recurrschedule_id: schema.dates_of_month.recurring_id,
          months_of_year: schema.dates_of_month.month_of_year,
        });
      val.push(monthsch2);
    }
    return val;
  }
}
