import { error, fail, redirect } from '@sveltejs/kit';
import { hoursToMilliseconds, parseNestedObject } from '$lib/utils.js';
import { listConnectedAccounts } from '$lib/infrastructure/auth/accountManagement.js';
import { db } from '$lib/infrastructure/db.js';
import { calendarProvider } from '$lib/infrastructure/calendar/index.js';

export const load = async ({ locals }) => {
	const connectedAccounts = await listConnectedAccounts(locals.session!.userId);
	const promises = connectedAccounts.map(async (account) => ({
		...account,
		calendars: await calendarProvider.calendars.list(account.id)
	}));
	const accountsExtended = await Promise.all(promises);

	return { accounts: accountsExtended };
};

type FormData = {
	sourceCalendar: { calendarId: string; accountId: string };
	targetCalendar: { calendarId: string; accountId: string };
};
export const actions = {
	default: async (event) => {
		const data = await event.request.formData();

		const arr = Array.from(data).map(([key, value]) => ({ key, value }));
		const { sourceCalendar, targetCalendar } = parseNestedObject<FormData>(arr);

		let syncRule = await db.syncRule.findFirst({
			where: {
				AND: [
					{ sourceAccountId: { equals: sourceCalendar.accountId } },
					{ sourceCalendarId: { equals: sourceCalendar.accountId } },
					{ targetAccountId: { equals: targetCalendar.accountId } },
					{ targetCalendarId: { equals: targetCalendar.accountId } }
				]
			}
		});

		if (syncRule) return fail(409, { message: 'Syncrule already exists.' });

		// redirect is catched as error and therefore has to be outside of try-catch block
		let success = false;
		let error: any;

		try {
			validateFormSubmission({ sourceCalendar, targetCalendar });
			await subscribeToCalendar(sourceCalendar.accountId, sourceCalendar.calendarId);

			syncRule = await db.syncRule.create({
				data: {
					sourceAccountId: sourceCalendar.accountId,
					sourceCalendarId: sourceCalendar.calendarId,
					targetAccountId: targetCalendar.accountId,
					targetCalendarId: targetCalendar.calendarId
				}
			});

			success = true;
		} catch (e: any) {
			success = false;
			error = e;
		}

		if (success) return redirect(302, '/dashboard');
		else return fail(401, { message: error?.message });
	}
};

const validateFormSubmission = (data: FormData) => {
	if (data.sourceCalendar.calendarId === data.targetCalendar.calendarId) {
		error(404, 'Can not sync calendar with itself.');
	}
};

const subscribeToCalendar = async (accountId: string, calendarId: string) => {
	const account = await db.account.findFirst({ where: { id: accountId } });
	if (!account) error(404, 'Account not found.');
	const expiration = getExpirationDate(hoursToMilliseconds(0.5));
	await calendarProvider.calendars.subscribe({ accountId, calendarId, expiration });
};

const getExpirationDate = (delta: number = hoursToMilliseconds(24)) => {
	return new Date(new Date().getTime() + delta);
};
