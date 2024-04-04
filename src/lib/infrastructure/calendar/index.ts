import type { Calendar, CalendarEvent, Provider } from '$lib/domain/types';
import { getAuthForAccount } from '../auth/accountManagement';
import { db } from '../db';
import { logger } from '../logger';
import { provider as googleProvider } from './google';
import type {
	CalendarProvider,
	CalendarSubscriptionRequest,
	CalendarEventIdentifier
} from './types';
import { error } from '@sveltejs/kit';

// ==== HELPER
const getCalendarProvider = (provider: Provider): CalendarProvider => {
	if (provider === 'google') return googleProvider;
	else error(500, `Unsupported provider: "${provider}".`);
};

const getOrThrowAcount = async (accountId: string) => {
	const account = await db.account.findFirst({ where: { id: accountId } });
	if (!account) error(500, `Could not retrieve account with id ${accountId}.`);
	return account;
};

// === SERVICE
const listCalendars = async (accountId: string): Promise<Calendar[]> => {
	const account = await getOrThrowAcount(accountId);
	const auth = await getAuthForAccount(account);
	const provider = getCalendarProvider(account.provider as Provider);
	return provider.calendars.list(auth);
};

const subscribeCalendarChanges = async (params: CalendarSubscriptionRequest) => {
	const { accountId, calendarId } = params;
	const account = await getOrThrowAcount(accountId);

	const syncChannel = await db.syncChannel.findFirst({
		where: { AND: [{ calendarId: { equals: calendarId } }, { accountId: { equals: accountId } }] }
	});

	if (syncChannel) {
		const msg = `Sync channel for account ${accountId} and calendar ${calendarId} exists. Skip Initation...`;
		logger().info(msg);
		return;
	}

	logger().info(`Initiate new sync channel creation for provider: ${account.provider}`);
	const auth = await getAuthForAccount(account);
	const provider = getCalendarProvider(account.provider as Provider);
	return provider.calendars.subscribeToChanges(params, auth);
};

const retrieveCalendarEvent = async (params: CalendarEventIdentifier): Promise<CalendarEvent> => {
	const account = await getOrThrowAcount(params.accountId);
	const auth = await getAuthForAccount(account);
	const provider = getCalendarProvider(account.provider as Provider);
	return provider.events.retrieve(params, auth);
};

const createCalendarEvent = async (event: Omit<CalendarEvent, 'eventId'>) => {
	const account = await getOrThrowAcount(event.accountId);
	const auth = await getAuthForAccount(account);
	const provider = getCalendarProvider(account.provider as Provider);
	return provider.events.create(event, auth);
};

const updateCalendarEvent = async (event: CalendarEvent) => {
	const account = await getOrThrowAcount(event.accountId);
	const auth = await getAuthForAccount(account);
	const provider = getCalendarProvider(account.provider as Provider);
	return provider.events.update(event, auth);
};

const deleteCalendarEvent = async (params: CalendarEventIdentifier & { accountId: string }) => {
	const account = await getOrThrowAcount(params.accountId);
	const auth = await getAuthForAccount(account);
	const provider = getCalendarProvider(account.provider as Provider);
	return await provider.events.delete(params, auth);
};

export const calendarProvider = {
	calendars: {
		list: listCalendars,
		subscribe: subscribeCalendarChanges
	},
	events: {
		create: createCalendarEvent,
		update: updateCalendarEvent,
		delete: deleteCalendarEvent,
		retrieve: retrieveCalendarEvent
	}
};
