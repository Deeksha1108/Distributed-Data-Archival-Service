# Task Archiver – Automated DB Archival System

## Cron-Based Data Archival using NestJS, PostgreSQL & AWS S3

This project is a **production-style backend system** that automatically **archives old database records** from PostgreSQL to **AWS S3** in **time-based chunks** using **cron jobs**.

It demonstrates how real-world backend systems:

- Control database growth
- Archive historical data safely
- Avoid duplicate exports
- Run background jobs reliably

## Problem This Project Solves

In real production systems:

- Databases grow continuously
- Old data slows down queries
- Keeping all data in DB is expensive and unnecessary

**Solution:**
Move old data to cheap storage (S3) in a **controlled, auditable, and automated way**.

This project implements exactly that.

## High-Level Flow (Simple Explanation)

```
PostgreSQL → (Cron Job) → Chunk Data → Upload to S3 → Delete from DB → Log Archive
```

### What happens automatically:

1. Cron job runs
2. Finds next **60-day data window**
3. Uploads tasks to AWS S3
4. Deletes archived records from DB
5. Saves archive history in `archive_logs`

No manual intervention required.

## Core Features Implemented

- Time-based chunking (60 days per run)

- Cron-based automation

- Safe archival (upload → then delete)

- No duplicate uploads (archive logs tracking)

- Worker threads for heavy S3 upload

- Production vs Testing cron configuration

- Fully auditable archive history

## Why Chunk-Based Archival?

Instead of exporting everything at once:

- Reduces memory usage
- Prevents DB overload
- Allows retry on failure
- Matches real production strategies

**Chunk size used:** `60 days`

## Cron Strategy (Testing vs Production)

### Testing

```typescript
@Cron(CronExpression.EVERY_MINUTE)
```

- Fast feedback
- Easy debugging

### Production (Recommended)

```typescript
@Cron('0 2 * * 0') // Every Sunday at 2 AM
```

**Why weekly at night?**

- Low traffic hours
- Predictable DB load
- Common industry standard for archival jobs

## Archival Safety Logic

Archival follows a **safe two-step process**:

1. Upload data to S3
2. Only after successful upload → delete from DB

**If upload fails:**

- DB data is **not deleted**
- Archive marked as FAILED
- Retry possible

## Archive Logs (Audit Trail)

Every archive run is tracked in `archive_logs` table:

| Field | Purpose |
|-------|---------|
| fromDate | Chunk start date |
| toDate | Chunk end date |
| status | RUNNING / SUCCESS / FAILED |
| s3Path | Uploaded file path |
| retryCount | Failure tracking |
| createdAt | Execution timestamp |

This ensures:

- No duplicate uploads
- Full traceability
- Easy debugging

## Tech Stack Used

- **NestJS**
- **PostgreSQL**
- **TypeORM**
- **AWS S3**
- **Worker Threads**
- **@nestjs/schedule (Cron Jobs)**
- **dotenv**

## Project Folder Structure

```
src/
├── common/
│   └── constants.ts
├── config/
│   └── aws.config.ts
├── database/
│   ├── entities/
│   │   ├── tasks.entity.ts
│   │   └── archive_logs.entity.ts
│   └── database.module.ts
├── modules/
│   ├── s3/
│   │   ├── s3.module.ts
│   │   └── s3.service.ts
│   └── tasks/
│       ├── tasks.cron.ts
│       ├── tasks.module.ts
│       ├── tasks.service.ts
│       └── tasks.worker.ts
├── app.module.ts
└── main.ts
```

## Environment Variables (.env)

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=admin
DB_NAME=task_archiver

# AWS S3
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=cron-db-bucket
```

`.env` is ignored from Git (as it should be).

## Setup Instructions

### Clone Repository

```bash
git clone https://github.com/Deeksha1108/Task-Archiver.git
cd task-archiver
npm install
```

### Start PostgreSQL

Ensure PostgreSQL is running and DB exists.

### Run Application

```bash
npm run start:dev
```

## What You'll See in Logs

```
[CRON] Task archive job started
[TasksService] Archiving 1278 tasks (2025-09-01 → 2025-10-30)
[TasksService] Archive success → deleted 1278 records
[CRON] Task archive job finished
```

## Production-Level Concepts Applied

- Background job processing
- Time-based data partitioning
- Safe delete after persistence
- Cloud storage offloading
- Audit logging
- Failure handling
- Clean modular architecture

## What I Learned from This Project

- How production systems manage large datasets
- How cron jobs are used responsibly
- Safe data archival strategies
- AWS S3 integration patterns
- Worker threads for heavy processing
- Avoiding duplicate background jobs
- Writing maintainable backend systems

---

**Made By Deeksha**

This project demonstrates **real-world backend archival architecture** using NestJS, PostgreSQL, and AWS S3 — focused on **scalability, safety, and automation**.
