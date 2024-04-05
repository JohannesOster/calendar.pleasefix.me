import { listConnectedAccounts } from '$lib/infrastructure/auth/accountManagement.js';
import { db } from '$lib/infrastructure/db.js';
import { calendarProvider } from '$lib/infrastructure/calendar/index.js';

export const load = async ({ locals }) => {
	const connectedAccounts = await listConnectedAccounts(locals.session!.userId);
	const promises = connectedAccounts.map(async (account) => ({
		...account,
		calendars: await calendarProvider.calendars.list(account.id)
	}));

	const accountIds = connectedAccounts.map(({ id }) => id);
	const syncRules = await db.syncRule.findMany({ where: { sourceAccountId: { in: accountIds } } });

	return { connectedAccounts: await Promise.all(promises), syncRules };
};
