import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Worker } from 'worker_threads';
import * as path from 'path';

import { Task } from 'src/database/entities/tasks.entity';
import {
  ArchiveLog,
  ARCHIVE_STATUS,
} from 'src/database/entities/archive_logs.entity';

const CHUNK_DAYS = 60;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(ArchiveLog)
    private readonly logRepo: Repository<ArchiveLog>,
  ) {}

  /**
   * Decide next 60-day window to archive
   */
  async getNextChunk() {
    const logs = await this.logRepo.find({
      order: { toDate: 'DESC' },
      take: 1,
    });

    const lastLog = logs[0];

    const startDate = lastLog
      ? new Date(lastLog.toDate)
      : new Date('2025-09-01'); // project start month

    if (lastLog) {
      startDate.setDate(startDate.getDate() + 1);
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + CHUNK_DAYS - 1);

    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .orderBy('task.createdAt', 'ASC')
      .getMany();

    return { tasks, startDate, endDate };
  }

  /**
   * Export chunk → S3 → delete from DB
   */
  async exportToS3() {
    // Prevent parallel cron runs
    const runningJob = await this.logRepo.findOne({
      where: { status: ARCHIVE_STATUS.RUNNING },
    });

    if (runningJob) {
      this.logger.warn('Archive already running. Skipping this cycle.');
      return 'Archive already running';
    }

    const { tasks, startDate, endDate } = await this.getNextChunk();

    if (!tasks.length) {
      this.logger.log('No data to archive');
      return 'No data to archive';
    }

    const log: ArchiveLog = this.logRepo.create({
      fromDate: startDate.toISOString().split('T')[0],
      toDate: endDate.toISOString().split('T')[0],
      status: ARCHIVE_STATUS.RUNNING,
      s3Path: '',
      retryCount: 0,
    });

    await this.logRepo.save(log);

    this.logger.log(
      `Archiving ${tasks.length} tasks (${log.fromDate} → ${log.toDate})`,
    );

    return new Promise((resolve, reject) => {
      const worker = new Worker(path.resolve(__dirname, 'tasks.worker.js'), {
        workerData: {
          tasks,
          s3Key: `tasks/${log.fromDate}_to_${log.toDate}.json`,
        },
      });

      worker.on('message', async (res) => {
        if (res.success) {
          // mark archive success
          log.status = ARCHIVE_STATUS.SUCCESS;
          log.s3Path = res.s3Path;
          await this.logRepo.save(log);

          // delete ONLY uploaded records
          const taskIds = tasks.map((t) => t.id);
          await this.taskRepo.delete({ id: In(taskIds) });

          this.logger.log(
            `Archive success → deleted ${taskIds.length} records`,
          );

          resolve(res.s3Path);
        } else {
          log.status = ARCHIVE_STATUS.FAILED;
          log.retryCount += 1;
          await this.logRepo.save(log);

          reject(res.error);
        }
      });

      worker.on('error', async (err) => {
        log.status = ARCHIVE_STATUS.FAILED;
        log.retryCount += 1;
        await this.logRepo.save(log);

        this.logger.error('Worker crashed', err);
        reject(err);
      });
    });
  }
}
