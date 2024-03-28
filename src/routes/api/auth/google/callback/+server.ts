import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/infrastructure/db';
import { Provider } from '$lib/domain/types.js';
import {
	exchangeGoogleAuthToken,
	validateGoogleIdTokenRequest
} from '$lib/infrastructure/auth/google.js';
import { logger } from '$lib/infrastructure/logger.js';
import {
	createAndEncryptSessionCookie,
	getSession,
	SESSION_COOKIE_KEY
} from '$lib/infrastructure/auth/session/session.js';
import { daysToSeconds } from '$lib/utils.js';
import { attachAccountToUser } from '$lib/infrastructure/auth/accountManagement.js';

// ================ Google Authentication Callback URL
// https://developers.google.com/identity/gsi/web/reference/js-reference#login_uri
export async function POST({ request, cookies, locals }) {
	const { traceId } = locals;
	const formData = await request.formData();

	// - Validate Google ID Token
	const { accountId } = await validateGoogleIdTokenRequest({ formData, cookies });
	const account = await db.account.findFirst({ where: { id: accountId } });

	// - Create new user if account does not exist
	if (!account) {
		logger().info({ traceId, message: 'No account found. Create new user and account.' });
		const newUser = { accounts: { create: { id: accountId, provider: Provider.google } } };
		await db.user.create({ data: newUser });
	}

	// - Login user
	logger().info({ traceId, message: 'Initiated new session.' });
	const sessionCookie = await createAndEncryptSessionCookie({ accountId });
	const cookieOpts = { secure: true, path: '/', httpOnly: true, maxAge: daysToSeconds(7) };
	cookies.set(SESSION_COOKIE_KEY, sessionCookie, cookieOpts);

	return redirect(302, '/dashboard');
}

// ================ Google Authorization Callbac URL
export async function GET({ url: { searchParams }, locals: { traceId }, cookies }) {
	const session = await getSession(cookies);

	// - Parameter validation
	const code = searchParams.get('code');
	if (!code) error(400, 'No "code" parameter in search query.');

	const state = searchParams.get('state');
	if (!state) error(400, 'No "state" parameter in search query.');

	// - Get Refresh Token
	const payload = await exchangeGoogleAuthToken(code);

	// - Attach new account to authenticated user
	await attachAccountToUser(traceId, session.userId, payload);

	// - Redirect
	const { redirectURL } = JSON.parse(atob(state));
	if (!redirectURL) error(400, 'No "redirectURL" attribute "state" parameter.');

	return redirect(302, redirectURL);
}
