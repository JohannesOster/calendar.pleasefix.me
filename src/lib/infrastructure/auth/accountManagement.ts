import { error } from '@sveltejs/kit';
import { logger } from '../logger';
import { db } from '../db';

type AttachAcountPayload = { accountId: string; refreshToken: string | null | undefined };
export const attachAccountToUser = async (
	traceId: string,
	userId: string,
	payload: AttachAcountPayload
) => {
	const { accountId, refreshToken } = payload;
	const account = await db.account.findFirst({ where: { id: accountId } });

	if (account) {
		if (userId !== account.userId) error(400, 'Account is already connected to different user.');

		if (refreshToken) {
			logger().info({ traceId, message: 'Received refresh token, update account.' });
			await db.account.update({ data: { refreshToken }, where: { id: accountId } });
		} else if (account.refreshToken) {
			logger().info({ traceId, message: 'Refresh token missing; one already stored.' });
		} else {
			error(400, 'Neither current request nor existing account record has a refresh token.');
		}
	} else {
		logger().info({ traceId, message: 'Connecting new account to user.' });
		if (!refreshToken) error(400, 'Missing refresh token.');
		await db.account.create({
			data: { id: accountId, userId, provider: 'google', refreshToken }
		});
	}
};
