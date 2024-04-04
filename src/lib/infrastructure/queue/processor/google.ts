import { error } from '@sveltejs/kit';
import type { Account, SyncChannel, SyncRule } from '@prisma/client';
import { assertValue } from '$lib/utils';
import { logger } from '$lib/infrastructure/logger';
import { db } from '$lib/infrastructure/db';
import { calendarProvider } from '$lib/infrastructure/calendar';
import type { CalendarEvent } from '$lib/domain/types';

export interface Props {
	traceId: string;
	syncChannel: SyncChannel;
	account: Account;
	syncRules: SyncRule[];
	channelId: string;
}

export const handleSyncTaskFromGoogle = async (props: Props) => {
	const { traceId, channelId, syncChannel, syncRules, account } = props;

	// ==== Validation
	const nextSyncToken = assertValue(syncChannel.nextSyncToken, 'Missing nextSyncToken');
	const calendarId = assertValue(syncChannel.calendarId, 'Missing calendarId');

	// ==== List all changes
	logger().info({ traceId, message: `List changes since last sync.` });
	const data = await calendarProvider.events.list({
		accountId: account.id,
		calendarId,
		syncToken: nextSyncToken
	});

	try {
		// ==== Handle Changes
		// For each syncRule that is affected by a notification on this channel
		for (const syncRule of syncRules) {
			// For each event that has changed since last synchronization
			for (const event of data.events) {
				// - Get type of event / item
				if (!event.eventId) error(500, `(${traceId}): Missing id of event.`);
				const notificationType = evaluteNotificationType(event);
				logger().info({ traceId, message: `Notification type: ${notificationType}` });

				// - Fetch reference to already synced item if exists
				const syncedItem = await db.syncedItem.findFirst({
					where: { syncRuleId: syncRule.id, sourceEventId: event.eventId }
				});

				// - Handle event cancellation
				if (notificationType === 'cancel') {
					if (!syncedItem) {
						logger().info({ traceId, message: `No syncItem found. Do nothing.` });
						continue;
					}

					logger().info({ traceId, message: `Found syncItem, delete target event and syncItem.` });
					await calendarProvider.events
						.delete({
							accountId: syncRule.targetAccountId,
							calendarId: syncRule.targetCalendarId,
							eventId: syncedItem.targetEventId
						})
						.catch(logger().error);

					await db.syncedItem.delete({ where: { id: syncedItem.id } });
					logger().info({ traceId, message: 'Deleted target event and synced item record.' });

					continue;
				}

				// - Handle event creation
				if (notificationType === 'create') {
					if (syncedItem) {
						logger().info({ traceId, message: `Synced item already exists. Do nothing.` });
						continue;
					}

					// Retrieve syncItem referencing the event that has triggered this syncing task.
					const prevEvent = await db.syncedItem.findMany({
						where: { targetEventId: event.eventId }
					});

					// There can only be a single predecessor to the event that triggered this syncing task.
					// (i.e. not multiple events can lead to th creation of the same event)
					if (prevEvent.length > 1) {
						// TODO: think about whether enforcing this in db level too
						error(500, 'TargetEventId of syncItem needs to be unique.');
					}

					/* The syncing history should record the calendars the event has already "went through". */
					let history = prevEvent.length === 1 ? prevEvent[0].history : '';

					// Lopp prevention
					if (history.includes(syncRule.targetCalendarId)) {
						logger().info({
							traceId,
							message: `Loop detected in event syncing. History: ${history}, already contains target calendar id: ${syncRule.targetCalendarId}.`
						});
						error(401, 'Detected loop. Skipping sync...');
					}

					history += history ? `,${syncRule.sourceCalendarId}` : syncRule.sourceCalendarId;

					logger().info({
						traceId,
						message: `Synchronization history of newly synced event: ${history}.`
					});

					// Note: Removing eventId before creating a new event prevents Google from reusing the ID,
					// ensuring each event has a unique identifier for simpler tracking of syncing history.
					const { eventId, ...props } = event;
					const newEvent = await calendarProvider.events.create({
						...props,
						accountId: syncRule.targetAccountId,
						calendarId: syncRule.targetCalendarId
					});

					await db.syncedItem.create({
						data: {
							syncRuleId: syncRule.id,
							sourceEventId: event.eventId,
							targetEventId: newEvent.eventId,
							history
						}
					});
					logger().info({
						traceId,
						message: `Successfully created sync item and event with id: ${newEvent.eventId}`
					});

					continue;
				}

				// - Handle event update
				if (notificationType === 'update') {
					if (!syncedItem) {
						logger().info({ traceId, message: `Did not find sync item. Do nothing.` });
						continue;
					}

					await calendarProvider.events.update({
						...event,
						accountId: syncRule.targetAccountId,
						calendarId: syncRule.targetCalendarId,
						eventId: syncedItem.targetEventId
					});

					logger().info({
						traceId,
						message: `Successfully updated event with id: ${syncedItem.targetEventId}.`
					});
				}
			}
		}
	} finally {
		if (data.nextSyncToken) {
			logger().info({ traceId, message: `Received new nextSyncToken. Update channel.` });
			await db.syncChannel.update({
				data: { nextSyncToken: data.nextSyncToken },
				where: { id: channelId }
			});
		} else {
			logger().info({ traceId, message: 'No new nextSyncToken.' });
		}
	}
};

const evaluteNotificationType = (event: CalendarEvent) => {
	if (event.status === 'cancelled') return 'cancel';
	else if (event.created && event.updated) {
		const created = new Date(event.created).getTime();
		const updated = new Date(event.updated).getTime();

		const delta = updated - created;
		const threshhold = 100 * 30; // 3 seconds
		const notificationType = delta < threshhold ? 'create' : 'update';
		return notificationType;
	}

	return 'create';
};
