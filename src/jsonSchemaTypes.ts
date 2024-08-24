type schedule = {
  id: string;
  title: string;
  description: string;
  time: string;
  time_Stamp: Date;
  user_id: string;
};

type schedule2 = {
  id: string;
  title: string;
  description: string;
  time: string;
  time_Stamp: Date;
  user_id: string;
  dates: scheduleDate[];
  state: state;
};

type shceduleJson = {
  id: string;
  title: string;
  star: boolean;
  time: string;
};

type schedule3 = {
  id: string;
  title: string;
  description: string;
  date_s: string[];
  time: string;
  user_id: string;
  star: boolean;
  isReccuring: boolean;
  frequency: string;
  interval: number;
  days: number[];
  dates: number[];
  months: number[];
};

type user = {
  id: string;
  username: string;
  email: string;
};

type user2 = {
  id: string;
  username: string;
  email: string;
  schedule: schedule[];
};

type user3 = {
  id: string;
  username: string;
  email: string;
  schedule: schedule2[];
};

type state = {
  id: string;
  star: boolean;
  isRecurring: boolean;
  isSnoozed: boolean;
  schedule_id: string;
};

type scheduleDate = {
  id: string;
  date: string;
  schedule_id: string;
};

export {
  schedule,
  schedule2,
  scheduleDate,
  user,
  user2,
  user3,
  state,
  schedule3,
  shceduleJson,
};
