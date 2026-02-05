import { parentPort, workerData } from 'worker_threads';
import { S3Service } from '../s3/s3.service';

async function processTasks(data: any) {
  const { tasks, s3Key } = data;

  // Convert tasks to JSON buffer
  const buffer = Buffer.from(JSON.stringify(tasks, null, 2));

  // Upload to S3
  const s3Service = new S3Service();
  const s3Path = await s3Service.uploadFile(s3Key, buffer);

  return s3Path;
}

// Run worker
processTasks(workerData)
  .then((result) => parentPort?.postMessage({ success: true, s3Path: result }))
  .catch((err) => parentPort?.postMessage({ success: false, error: err.message }));
