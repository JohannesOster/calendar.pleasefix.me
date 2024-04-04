import { error } from '@sveltejs/kit';
import { google } from 'googleapis';
import { type OAuth2Client } from 'google-auth-library';
import type { Account } from '@prisma/client';
import { logger } from '../logger';
import { db } from '../db';
import { getGoogleOAuth2Client } from './google';

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

export const getAuthForAccount = async (account: Account) => {
	if (account.provider === 'google') {
		if (!account.refreshToken) error(400, 'Missing refresh token');
		const googleOAuth2Client = getGoogleOAuth2Client();
		googleOAuth2Client.setCredentials({ refresh_token: account.refreshToken });
		return googleOAuth2Client;
	}
	error(500, `Unsupported Provider: ${account.provider}`);
};

export const retrieveEmailForAccount = async (account: Account) => {
	const auth = await getAuthForAccount(account);
	if (account.provider === 'google') {
		const { data } = await google
			.oauth2('v2')
			.userinfo.get({ auth: auth as OAuth2Client })
			.catch(({ response }) => {
				error(response.status, response.data);
			});
		if (!data.email) return error(500, "Couldn't fetch e-mail from google");
		return data.email;
	}
	error(500, `Unsupported Provider: ${account.provider}`);
};

export const listConnectedAccounts = async (userId: string) => {
	const connectedAccountsRaw = await db.account.findMany({
		where: { AND: [{ userId: { equals: userId } }, { refreshToken: { not: null } }] }
	});

	const promises = connectedAccountsRaw.map(async (account) => {
		try {
			const email = await retrieveEmailForAccount(account);
			return { ...account, email };
		} catch (err) {
			logger().error({ message: 'Failed to retrieve email for account.', err });
			return { ...account, email: null };
		}
	});

	return Promise.all(promises).then((accounts) =>
		accounts.filter((account) => account.email != null)
	) as Promise<(Account & { email: string })[]>;
};
