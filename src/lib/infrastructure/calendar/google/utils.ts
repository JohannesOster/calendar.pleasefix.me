export const getRFC3339Timestamp = () => {
	const now = new Date();

	// Format the date to YYYY-MM-DD
	const date = now.toISOString().split('T')[0];

	// Format the time to HH:MM:SS
	let time = now.toTimeString().split(' ')[0];

	// Get the timeZone offset in minutes
	const timeZoneOffset = now.getTimezoneOffset();

	// Convert timeZone offset to HH:MM format
	const offsetHours = String(Math.floor(Math.abs(timeZoneOffset) / 60)).padStart(2, '0');
	const offsetMinutes = String(Math.abs(timeZoneOffset) % 60).padStart(2, '0');
	const offsetSign = timeZoneOffset > 0 ? '-' : '+';

	return `${date}T${time}${offsetSign}${offsetHours}:${offsetMinutes}`;
};
