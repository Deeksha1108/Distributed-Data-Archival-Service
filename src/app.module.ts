import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './modules/tasks/tasks.module';
import { S3Module } from './modules/s3/s3.module';
import * as dotenv from 'dotenv';
import { ArchiveLog } from './database/entities/archive_logs.entity';
import { Task } from './database/entities/tasks.entity';
dotenv.config();

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'task_archiver',
      entities: [Task, ArchiveLog],
      synchronize: true,
    }),
    TasksModule,
    S3Module,
  ],
})
export class AppModule {}
