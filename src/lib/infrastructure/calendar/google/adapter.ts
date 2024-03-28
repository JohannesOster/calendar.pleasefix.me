import { DateTime } from 'luxon';
import type { calendar_v3 } from 'googleapis';
import { assertValue } from '$lib/utils';
import {
	CalendarEventStatus,
	type Calendar,
	type CalendarEvent,
	type ConferenceData
} from '$lib/domain/types';

type GoogleCalendar = calendar_v3.Schema$CalendarListEntry;
type GoogleEvent = calendar_v3.Schema$Event;
type GoogleConferenceData = calendar_v3.Schema$ConferenceData;
type GoogleConferenceEntryPoint = calendar_v3.Schema$EntryPoint;

// ======== CALENDAR
const fromGoogleCalendar = (calendar: GoogleCalendar): Calendar => {
	const calendarId = assertValue(calendar.id, 'Missing calendar id.');
	const title = assertValue(calendar.summary, 'Missing calendar summary');
	const color = assertValue(calendar.backgroundColor, 'Missing calendar background color');

	return { calendarId, title, color };
};

// ======== EVENT
function toGoogleEvent(event: CalendarEvent): GoogleEvent;
function toGoogleEvent(event: Omit<CalendarEvent, 'eventId'>): GoogleEvent;
function toGoogleEvent(event: any): GoogleEvent {
	const _event = event as CalendarEvent;

	const mapConferenceData = (conferenceData: ConferenceData): GoogleConferenceData => {
		let entryPoints: GoogleConferenceEntryPoint[] = [];

		if (conferenceData.url) {
			entryPoints.push({
				entryPointType: 'video',
				uri: conferenceData.url,
				label: conferenceData.providerName || 'Video Conference'
			});
		}

		if (conferenceData.phones) {
			conferenceData.phones.forEach((phoneNumber) => {
				entryPoints.push({
					entryPointType: 'phone',
					uri: `tel:${phoneNumber}`,
					label: `${conferenceData.providerName || 'Phone Conference'}: ${phoneNumber}`
				});
			});
		}

		return {
			conferenceId: conferenceData.conferenceId,
			entryPoints: entryPoints,
			conferenceSolution: {
				name: conferenceData.providerName,
				key: {
					type: conferenceData.url?.includes('meet.google.com') ? 'hangoutsMeet' : 'addOn'
				}
			}
		};
	};

	return {
		...(_event.eventId ? { id: _event.eventId } : {}),

		summary: _event.title,
		description: _event.description,

		start: { dateTime: _event.start.dateTime, timeZone: _event.start.tzId },
		end: { dateTime: _event.end.dateTime, timeZone: _event.end.tzId },

		status: _event.status,

		location: _event.location,

		conferenceData: _event.conferenceData ? mapConferenceData(_event.conferenceData) : undefined
	};
}

const fromGoogleEvent = (
	event: GoogleEvent,
	details: { accountId: string; calendarId: string }
): CalendarEvent => {
	const mapConferenceData = (conferenceData: GoogleConferenceData): ConferenceData => {
		const conference: ConferenceData = { conferenceId: conferenceData.conferenceId || undefined };

		conferenceData.entryPoints?.forEach((entryPoint) => {
			switch (entryPoint.entryPointType) {
				case 'video':
					conference.url = entryPoint.uri || '';
					break;
				case 'phone':
					if (!conference.phones) conference.phones = [];
					conference.phones.push(entryPoint.uri?.replace('tel:', '') || '');
					break;
			}

			conference.providerName = conferenceData.conferenceSolution?.name || '';
		});

		return conference;
	};

	const eventId = assertValue(event.id, 'Missing event id');
	const title = event.summary || undefined;
	const description = event.description || undefined;

	const status = (event.status as CalendarEventStatus) || CalendarEventStatus.unknown;

	const startDateTimeRaw = assertValue(event.start?.dateTime, 'Missing event start dateTime');

	const endDateTimeRaw = assertValue(event.end?.dateTime, 'Missing event end dateTime');

	const startDateTimeObj = DateTime.fromISO(startDateTimeRaw);
	const endDateTimeObj = DateTime.fromISO(endDateTimeRaw);

	const startDateTime = assertValue(startDateTimeObj.toISO(), "Can't retrieve datetime for start");
	const startTimeZone = assertValue(startDateTimeObj.zoneName, "Can't retrieve timezone for start");

	const endDateTime = assertValue(endDateTimeObj.toISO(), "Can't retrieve datetime for end");
	const endTimeZone = assertValue(endDateTimeObj.zoneName, "Can't retrieve timezone for end");

	const location = event.location || undefined;

	return {
		calendarId: details.calendarId,
		accountId: details.accountId,
		eventId,

		title,
		description,

		start: { dateTime: startDateTime, tzId: startTimeZone },
		end: { dateTime: endDateTime, tzId: endTimeZone },

		status,

		location,

		conferenceData: event.conferenceData ? mapConferenceData(event.conferenceData) : undefined
	};
};

export const adapter = {
	calendars: { fromProvider: fromGoogleCalendar },
	events: { toProvider: toGoogleEvent, fromProvider: fromGoogleEvent }
};
