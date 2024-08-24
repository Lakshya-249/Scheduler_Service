import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AppService2 } from './app.service2';
import { user, schedule3, shceduleJson } from './jsonSchemaTypes';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appService2: AppService2,
  ) {}

  @Post('user')
  createUsers(@Body() createUserDto: user) {
    return this.appService.createUsers(
      createUserDto.username,
      createUserDto.email,
    );
  }

  @Get('schedule')
  async getSchedules(@Query('id') id: string, @Query('date') date: string) {
    let schedule: shceduleJson[] = [];
    const schedule1 = await this.appService.getschedules(id, date);
    const schedule2 = await this.appService2.getrecurringSchedules(id, date);
    schedule = [...schedule1, ...schedule2];
    return schedule;
    // return this.appService.getschedules(id, date);
    // return this.appService2.getrecurringSchedules(id, date);
  }

  @Post('schedule')
  createschedules(@Body() createScheduleDto: schedule3) {
    if (createScheduleDto.isReccuring) {
      return this.appService2.createRecurringSchedule(createScheduleDto);
    }
    return this.appService.createschedules(createScheduleDto);
  }

  @Get('mydate')
  mydate() {
    return this.appService.mydate();
  }

  @Get('getimportantschedules')
  async getImportantSchedules(
    @Query('id') id: string,
    @Query('date') date: string,
  ) {
    const recurrsch = await this.appService2.getrecurringSchedules(
      id,
      date,
      true,
    );
    const normalsch = await this.appService.getImportantSchedules(id, date);
    return [...recurrsch, ...normalsch];
  }
  @Put('schedule')
  updateSchedule(@Body() updateScheduleDto: schedule3) {
    console.log(updateScheduleDto.isReccuring);

    if (updateScheduleDto.isReccuring) {
      return this.appService2.updateRecurrSchedule(updateScheduleDto);
    }
    return this.appService.updateSchedule(updateScheduleDto);
  }

  @Get('allschedules/:id')
  getAllSchedule(@Param('id') id: string) {
    return this.appService.getallSchedule(id);
  }

  @Put('setimportant')
  setStar(@Query('id') id: string) {
    return this.appService.setStar(id);
  }

  @Put('setsnooze')
  setSnoozeSchedule(@Query('id') id: string, @Query('isSnz') val: string) {
    console.log(val);

    return this.appService.setSnoozeSchedule(id, val);
  }

  @Get('recentschedules/:id')
  recentSchedules(@Param('id') id: string) {
    return this.appService.recentSchedules(id);
  }

  @Get('snoozedschedules/:id')
  snoozedSchedules(@Param('id') id: string) {
    return this.appService.snoozedSchedules(id);
  }

  @Delete('schedule/:id')
  deleteSchedule(@Param('id') id: string) {
    console.log(id);
    return this.appService.deleteSchedule(id);
  }

  @Get('scheduleID')
  getScheduleDetail(@Query('id') id: string) {
    return this.appService2.getScheduleDetail(id);
  }
}
