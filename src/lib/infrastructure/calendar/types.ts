import type { Calendar, CalendarEvent } from '$lib/domain/types';
import type { OAuth2Client } from 'google-auth-library';

export type Auth = OAuth2Client;

export interface CalendarEventIdentifier {
	accountId: string;
	calendarId: string;
	eventId: string;
}

export interface CalendarSubscriptionRequest {
	accountId: string;
	calendarId: string;
	expiration?: Date;
}

export interface ListCalendarEventsQuery {
	accountId: string;
	calendarId: string;
	maxResults?: number;
	syncToken?: string;
}

export interface CalendarProvider {
	calendars: {
		list: (auth: Auth) => Promise<Calendar[]>;
		subscribeToChanges: (details: CalendarSubscriptionRequest, auth: Auth) => Promise<void>;
	};
	events: {
		list: (
			query: ListCalendarEventsQuery,
			auth: Auth
		) => Promise<{ nextSyncToken?: string; events: CalendarEvent[] }>;
		create: (event: Omit<CalendarEvent, 'eventId'>, auth: Auth) => Promise<CalendarEvent>;
		retrieve: (query: CalendarEventIdentifier, auth: Auth) => Promise<CalendarEvent>;
		update: (event: CalendarEvent, auth: Auth) => Promise<CalendarEvent>;
		delete: (details: CalendarEventIdentifier, auth: Auth) => Promise<void>;
	};
}
