import type { Processor } from 'bullmq';
import { error } from '@sveltejs/kit';
import { db } from '$lib/infrastructure/db';
import { logger } from '$lib/infrastructure/logger';
import { handleSyncTaskFromGoogle } from './google';

type SyncTaskPayload = {
	traceId: string;
	channelId: string;
};

export const handleSyncTask: Processor<SyncTaskPayload> = async (payload) => {
	const { id, data } = payload;
	const { channelId, traceId } = data;

	logger().info(`Received sync task with traceId ${traceId}.`);

	try {
		const syncChannel = await db.syncChannel.findFirst({
			where: { id: channelId },
			include: { account: true }
		});

		if (!syncChannel) error(500, `SyncChannel ${channelId} does not exists`);

		const syncRules = await db.syncRule.findMany({
			where: { sourceAccountId: syncChannel.accountId, sourceCalendarId: syncChannel.calendarId }
		});

		if (!syncRules.length) error(500, `No sync jobs associated with channel ${channelId}`);

		const account = syncChannel.account;
		const { provider } = account;
		logger().info({
			traceId,
			message: `Source calendar: ${provider} - ${syncChannel.calendarId}`
		});

		if (provider === 'google') {
			await handleSyncTaskFromGoogle({ traceId, channelId, syncChannel, syncRules, account });
			return;
		}

		error(500, `Provider not supported: ${provider}`);
	} catch (error: any) {
		logger().error(`${id} has failed with error: ${error}`);
	}
};
