import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TasksService } from './tasks.service';

@Injectable()
export class TasksCron {
  constructor(private readonly tasksService: TasksService) {}

  // @Cron(CronExpression.EVERY_MINUTE)  // TESTING: every 1 minute
  @Cron('0 2 * * 0') // weekly (Sunday 2 AM)
  async handleArchive() {
    console.log('[CRON] Task archive job started');
    await this.tasksService.exportToS3();
    console.log('[CRON] Task archive job finished');
  }
}
