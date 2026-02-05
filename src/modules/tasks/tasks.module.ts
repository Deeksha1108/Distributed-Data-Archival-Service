import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksCron } from './tasks.cron';
import { S3Module } from '../s3/s3.module';
import { ArchiveLog } from 'src/database/entities/archive_logs.entity';
import { Task } from 'src/database/entities/tasks.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, ArchiveLog]), S3Module],
  providers: [TasksService, TasksCron],
})
export class TasksModule {}
