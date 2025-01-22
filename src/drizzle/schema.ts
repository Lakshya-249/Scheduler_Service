import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const userTable = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').unique(), // Adjusted from 'name' to 'username'
  email: text('email').unique(),
  name: text('name'), // Added field for the user's full name
  password: text('password'), // Added field for encrypted password
});

export const scheduleTable = pgTable('schedule', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title'),
  description: text('description'),
  time: time('time', { withTimezone: false }),
  time_Stamp: timestamp('time_Stamp').defaultNow(),
  user_id: uuid('user_id')
    .references(() => userTable.id, { onDelete: 'cascade' })
    .notNull(),
});

export const schedulesDateTable = pgTable('dateTable', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date'),
  schedule_id: uuid('schedule_id')
    .references(() => scheduleTable.id, { onDelete: 'cascade' })
    .notNull(),
});

export const scheduleStateTable = pgTable('stateTable', {
  id: uuid('id').defaultRandom().primaryKey(),
  star: boolean('star').default(false),
  isRecurring: boolean('is_recurring').default(false),
  isSnoozed: boolean('is_Snoozed').default(false),
  reminderSent: boolean('reminder_sent').default(false),
  schedule_id: uuid('schedule_id')
    .references(() => scheduleTable.id, { onDelete: 'cascade' })
    .notNull(),
});

// Updated recurring schedule table
export const recurringScheduleTable = pgTable('recurring_schedule', {
  id: uuid('id').defaultRandom().primaryKey(),
  schedule_id: uuid('schedule_id')
    .references(() => scheduleTable.id, { onDelete: 'cascade' })
    .notNull(),
  frequency: text('frequency').notNull().default('daily'), // 'daily', 'weekly', 'monthly', 'yearly'
  interval: integer('interval').default(1),
  start_date: timestamp('start_date').defaultNow(),
});

export const days_of_week = pgTable('days_of_week', {
  id: uuid('id').defaultRandom().primaryKey(),
  day: integer('day'),
  schedule_id: uuid('schedule_id')
    .references(() => scheduleTable.id, { onDelete: 'cascade' })
    .notNull(),
  recurring_id: uuid('recurring_id')
    .references(() => recurringScheduleTable.id, { onDelete: 'cascade' })
    .notNull(),
});

export const dates_of_month = pgTable('dates_of_month', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: integer('date').default(1),
  schedule_id: uuid('schedule_id')
    .references(() => scheduleTable.id, { onDelete: 'cascade' })
    .notNull(),
  recurring_id: uuid('recurring_id')
    .references(() => recurringScheduleTable.id, { onDelete: 'cascade' })
    .notNull(),

  month_of_year: uuid('month_of_year').references(() => months_of_year.id, {
    onDelete: 'cascade',
  }),
});

export const months_of_year = pgTable('months_of_year', {
  id: uuid('id').defaultRandom().primaryKey(),
  month: integer('month'),
  schedule_id: uuid('schedule_id')
    .references(() => scheduleTable.id, { onDelete: 'cascade' })
    .notNull(),
  recurring_id: uuid('recurring_id')
    .references(() => recurringScheduleTable.id, { onDelete: 'cascade' })
    .notNull(),
});

export const daysRelation = relations(days_of_week, ({ one }) => ({
  daysOfWeek: one(scheduleTable, {
    fields: [days_of_week.schedule_id],
    references: [scheduleTable.id],
  }),
}));

export const datesRelation = relations(dates_of_month, ({ one }) => ({
  datesOfMonth: one(scheduleTable, {
    fields: [dates_of_month.schedule_id],
    references: [scheduleTable.id],
  }),
}));

export const monthsRelation = relations(months_of_year, ({ one }) => ({
  monthsOfYear: one(scheduleTable, {
    fields: [months_of_year.schedule_id],
    references: [scheduleTable.id],
  }),
}));

// Recurring Table Relation
export const RecurrTableRelation = relations(scheduleTable, ({ one }) => ({
  recurringSchedule: one(recurringScheduleTable, {
    fields: [scheduleTable.id],
    references: [recurringScheduleTable.schedule_id],
  }),
}));

export const RecurringRelation = relations(
  recurringScheduleTable,
  ({ one }) => ({
    recurringValue: one(scheduleTable, {
      fields: [recurringScheduleTable.schedule_id],
      references: [scheduleTable.id],
    }),
  }),
);

// Date Table Relation
export const scheduleDateRelation = relations(scheduleTable, ({ many }) => ({
  dates: many(schedulesDateTable),
}));

export const DateTable = relations(schedulesDateTable, ({ one }) => ({
  scheduleDates: one(scheduleTable, {
    fields: [schedulesDateTable.schedule_id],
    references: [scheduleTable.id],
  }),
}));

// User Table Relations
export const userRelations = relations(userTable, ({ many }) => ({
  schedules: many(scheduleTable),
}));

export const scheduleRelations = relations(scheduleTable, ({ one }) => ({
  user: one(userTable, {
    fields: [scheduleTable.user_id],
    references: [userTable.id],
  }),
}));

// State Table Relation

export const stateRelations = relations(scheduleTable, ({ one }) => ({
  state: one(scheduleStateTable, {
    fields: [scheduleTable.id],
    references: [scheduleStateTable.schedule_id],
  }),
}));

export const scheduleStateRelations = relations(
  scheduleStateTable,
  ({ one }) => ({
    states: one(scheduleTable, {
      fields: [scheduleStateTable.schedule_id],
      references: [scheduleTable.id],
    }),
  }),
);
