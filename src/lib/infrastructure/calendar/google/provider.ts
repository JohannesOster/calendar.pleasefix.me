import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { error } from '@sveltejs/kit';
import { assertValue, randomStr } from '$lib/utils';
import type {
	Auth,
	CalendarProvider,
	CalendarSubscriptionRequest,
	CalendarEventIdentifier,
	ListCalendarEventsQuery
} from '../types';
import type { Calendar, CalendarEvent } from '$lib/domain/types';
import { adapter } from './adapter';
import { loadConfig } from '$lib/config';
import { getRFC3339Timestamp } from './utils';
import { db } from '$lib/infrastructure/db';

const api = google.calendar('v3');

const DEFAULT_MAX_RESULTS = 200;

// =============== Calendars
const listCalendars = async (auth: Auth): Promise<Calendar[]> => {
	if (!(auth instanceof OAuth2Client)) {
		error(500, 'Incorrect auth object was passed. Google requires OAuth2Client');
	}

	const resp = await api.calendarList
		.list({ auth })
		.then(({ data }) => data.items || [])
		.then((calendars) => calendars.map(adapter.calendars.fromProvider));

	return resp;
};

const subscribeToCalendarChanges = async (
	{ accountId, calendarId, expiration }: CalendarSubscriptionRequest,
	auth: Auth
) => {
	if (!(auth instanceof OAuth2Client)) {
		error(500, 'Incorrect auth object was passed. Google requires OAuth2Client');
	}

	// Note: we only sync forward from now, but need a nextSyncToken, therefore
	// we just request all event between a timestamp and itself.
	const timeStamp = getRFC3339Timestamp();
	const calendars = await google.calendar('v3').events.list({
		calendarId,
		maxResults: 1,
		timeMin: timeStamp,
		timeMax: timeStamp,
		auth
	});

	const nextSyncToken = calendars.data.nextSyncToken;
	if (!nextSyncToken) error(502, 'No nextSyncToken.');

	// ====  "subscribe" to calendar events
	const { baseURL } = await loadConfig();
	const expirationDate = assertValue(expiration, 'No expiration date.');
	const syncChannelId = randomStr();
	const resp = await api.events.watch({
		calendarId,
		requestBody: {
			id: syncChannelId,
			type: 'web_hook',
			address: `${baseURL}/api/accounts/${accountId}/calendars/${calendarId}/events/webhook`,
			expiration: `${expirationDate.getTime()}`
		},
		auth
	});

	if (!resp.data.resourceId) error(500, 'Missing resource id');

	// ====  Create syncChannel in db to keep track of nextSyncToken
	await db.syncChannel.create({
		data: {
			id: syncChannelId,
			resourceId: resp.data.resourceId,
			accountId,
			calendarId,
			nextSyncToken,
			expiration
		}
	});

	return;
};

// =============== Calendar Events
const createCalendarEvent = async (details: Omit<CalendarEvent, 'eventId'>, auth: Auth) => {
	// https://developers.google.com/calendar/api/guides/create-events
	if (!(auth instanceof OAuth2Client)) {
		error(500, 'Incorrect auth object was passed. Google requires OAuth2Client');
	}

	const requestBody = adapter.events.toProvider(details);

	const resp = await api.events.insert({
		calendarId: details.calendarId,
		requestBody,
		conferenceDataVersion: 1,
		auth
	});

	return adapter.events.fromProvider(resp.data, {
		calendarId: details.calendarId,
		accountId: details.accountId
	});
};

const retrieveCalendarEvent = async (query: CalendarEventIdentifier, auth: Auth) => {
	if (!(auth instanceof OAuth2Client)) {
		error(500, 'Incorrect auth object was passed. Google requires OAuth2Client');
	}
	const { data } = await api.events.get({
		calendarId: query.calendarId,
		eventId: query.eventId,
		auth
	});
	if (!data) error(404);

	return adapter.events.fromProvider(data, {
		accountId: query.accountId,
		calendarId: query.calendarId
	});
};

const updateCalendarEvent = async (event: CalendarEvent, auth: Auth) => {
	if (!(auth instanceof OAuth2Client)) {
		error(500, 'Incorrect auth object was passed. Google requires OAuth2Client');
	}

	const requestBody = adapter.events.toProvider(event);

	const resp = await api.events.update({
		eventId: event.eventId,
		calendarId: event.calendarId,
		requestBody,
		conferenceDataVersion: 1,
		auth
	});

	return adapter.events.fromProvider(resp.data, {
		calendarId: event.calendarId,
		accountId: event.accountId
	});
};

const deleteCalendarEvent = async (details: CalendarEventIdentifier, auth: Auth) => {
	if (!(auth instanceof OAuth2Client)) {
		error(500, 'Incorrect auth object was passed. Google requires OAuth2Client');
	}

	await api.events.delete({
		eventId: details.eventId,
		calendarId: details.calendarId,
		auth: auth
	});
};

const listCalendarEvents = async (query: ListCalendarEventsQuery, auth: Auth) => {
	if (!(auth instanceof OAuth2Client)) {
		error(500, 'Incorrect auth object was passed. Google requires OAuth2Client');
	}

	const { calendarId, accountId, syncToken, maxResults = DEFAULT_MAX_RESULTS } = query;
	const { data } = await api.events.list({ calendarId, maxResults, syncToken, auth });
	if (!data || !data.items) return { nextSyncToken: data.nextSyncToken || undefined, events: [] };

	return {
		nextSyncToken: data.nextSyncToken || undefined,
		events: data.items.map((event) => adapter.events.fromProvider(event, { accountId, calendarId }))
	};
};

export const provider: CalendarProvider = {
	calendars: {
		list: listCalendars,
		subscribeToChanges: subscribeToCalendarChanges
	},
	events: {
		list: listCalendarEvents,
		create: createCalendarEvent,
		retrieve: retrieveCalendarEvent,
		update: updateCalendarEvent,
		delete: deleteCalendarEvent
	}
};
