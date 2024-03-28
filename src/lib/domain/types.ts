type ISO8601DateString = string; // ISO 8601 format: "2020-06-01T21:15:00.000Z"
interface DateTime {
	dateTime: ISO8601DateString;
	tzId: string; // TimezoneIdentifier IANA Time Zone Database name: "Europe/Zurich"
}

export enum Provider {
	google = 'google',
	microsoft = 'microsoft'
}

// google: https://developers.google.com/calendar/api/v3/reference/calendarList
// microsoft: https://learn.microsoft.com/en-us/graph/api/resources/calendar
export interface Calendar {
	calendarId: string; // G.id, M.id
	title: string; // G.summary, M.name
	color: string; // G.backgroundColor, M.color / M.hexColor
}

export enum CalendarEventStatus {
	tentative = 'tentative',
	confirme = 'confirmed',
	cancelled = 'cancelled',
	unknown = 'unknown'
}

export interface ConferenceData {
	conferenceId?: string;
	providerName?: string;
	url?: string;
	phones?: string[];
	// meeting provider dependent attributes
	meetingCode?: string;
	accessCode?: string;
	passcode?: string;
	password?: string;
	pin?: string;
}

export interface CalendarEvent {
	eventId: string;
	accountId: string;
	calendarId: string;

	title?: string;
	description?: string;

	start: DateTime;
	end: DateTime;

	status: CalendarEventStatus;

	location?: string;

	conferenceData?: ConferenceData;
}
