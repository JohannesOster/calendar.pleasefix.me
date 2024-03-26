import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { Provider } from '$lib/domain/models.js';
import { validateGoogleIdTokenRequest } from '$lib/infrastructure/auth/google.js';
import { logger } from '$lib/infrastructure/logger.js';
import {
	createAndEncryptSessionCookie,
	SESSION_COOKIE_KEY
} from '$lib/infrastructure/auth/session/session.js';
import { daysToSeconds } from '$lib/utils.js';

export async function POST({ request, cookies, locals }) {
	const { traceId } = locals;
	const formData = await request.formData();

	const { accountId } = await validateGoogleIdTokenRequest({ formData, cookies });
	const account = await db.account.findFirst({ where: { id: accountId } });

	if (!account) {
		logger().info({ traceId, message: 'No account found. Create new user and account.' });
		await createUserAndAccount(accountId);
	}

	logger().info({ traceId, message: 'Initiated new session.' });
	const sessionCookie = await createAndEncryptSessionCookie({ accountId });
	cookies.set(SESSION_COOKIE_KEY, sessionCookie, {
		secure: true,
		path: '/',
		httpOnly: true,
		maxAge: daysToSeconds(7)
	});

	return redirect(302, '/dashboard');
}

const createUserAndAccount = async (accountId: string) => {
	const newUser = { accounts: { create: { id: accountId, provider: Provider.google } } };
	await db.user.create({ data: newUser });
};
