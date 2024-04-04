import { Queue, Worker } from 'bullmq';
import { loadConfig } from '$lib/config';
import { logger } from '../logger';
import { handleSyncTask } from './processor';

const config = await loadConfig();
const QUEUE_NAME = 'sync-tasks-queue';
const connection = { host: config.redis.host, port: config.redis.port };

export const queue = new Queue(QUEUE_NAME, { connection });

if (!(global as any).bullmqWorkerStarted) {
	const worker = new Worker(QUEUE_NAME, handleSyncTask, { connection });

	worker.on('completed', (job) => {
		logger().info(`${job.id} has completed.`);
	});

	worker.on('failed', (job, err) => {
		logger().error(`${job?.id} has failed with ${err.message}.`);
	});

	(global as any).bullmqWorkerStarted = true;
	logger().info('BullMQ worker started.');
}
