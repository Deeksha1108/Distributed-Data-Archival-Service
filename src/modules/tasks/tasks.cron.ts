import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TasksService } from './tasks.service';

@Injectable()
export class TasksCron {
  constructor(private readonly tasksService: TasksService) {}

  // TESTING: every 1 minute
  // PROD: weekly (Sunday 2 AM)
  @Cron(CronExpression.EVERY_MINUTE)
  // @Cron('0 2 * * 0')
  async handleArchive() {
    console.log('[CRON] Task archive job started');
    await this.tasksService.exportToS3();
    console.log('[CRON] Task archive job finished');
  }
}
