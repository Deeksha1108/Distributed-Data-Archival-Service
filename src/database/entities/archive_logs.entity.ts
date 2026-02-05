import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum ARCHIVE_STATUS {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('archive_logs')
export class ArchiveLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fromDate: string;

  @Column()
  toDate: string;

  @Column({
    type: 'enum',
    enum: ARCHIVE_STATUS,
  })
  status: ARCHIVE_STATUS;

  @Column({ nullable: true })
  s3Path: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
