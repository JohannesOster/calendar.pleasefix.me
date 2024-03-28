import { db } from '$lib/infrastructure/db';
import { randomStr } from '$lib/utils';
import { decrypt, encrypt } from './encryption';
import { error, type Cookies } from '@sveltejs/kit';

export type SessionCookiePayload = { sessionId: string; accountId: string };
export type Session = SessionCookiePayload & { userId: string };

export const SESSION_COOKIE_KEY = 'calendars.pleasefix.me-session';

export const getSession = async (cookies: Cookies) => {
	const sessionCookie = cookies.get(SESSION_COOKIE_KEY);
	if (!sessionCookie) error(401, 'Missing session cookie');
	return await decryptSessionCookie(sessionCookie);
};

export const decryptSessionCookie = async (cookie: string): Promise<Session> => {
	return decrypt(cookie)
		.then(JSON.parse)
		.then(async (session: Session) => {
			const account = await db.account.findFirst({ where: { id: session.accountId } });
			if (account) return { ...session, userId: account.userId };
			else error(401, 'Invalid session');
		});
};

export const createAndEncryptSessionCookie = async (payload: { accountId: string }) => {
	const sessionId = randomStr();
	const sessionCookiePayload: SessionCookiePayload = { sessionId, ...payload };
	const sessionCookie = await encrypt(sessionCookiePayload);
	return sessionCookie;
};
