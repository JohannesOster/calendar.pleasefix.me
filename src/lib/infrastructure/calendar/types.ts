import type { Calendar, CalendarEvent } from '$lib/domain/types';
import type { OAuth2Client } from 'google-auth-library';

export type Auth = OAuth2Client;

export interface EventIdentifier {
	accountId: string;
	calendarId: string;
	eventId: string;
}

export interface CalendarSubscriptionRequest {
	accountId: string;
	calendarId: string;
	expiration?: Date;
}

export interface CalendarProvider {
	calendars: {
		list: (auth: Auth) => Promise<Calendar[]>;
		subscribeToChanges: (details: CalendarSubscriptionRequest, auth: Auth) => Promise<void>;
	};
	events: {
		create: (event: Omit<CalendarEvent, 'eventId'>, auth: Auth) => Promise<CalendarEvent>;
		retrieve: (query: EventIdentifier, auth: Auth) => Promise<CalendarEvent>;
		update: (event: CalendarEvent, auth: Auth) => Promise<CalendarEvent>;
		delete: (details: EventIdentifier, auth: Auth) => Promise<void>;
	};
}
