import { getGoogleAuthorizationURL } from '$lib/infrastructure/auth/google.js';
import { SESSION_COOKIE_KEY } from '$lib/infrastructure/auth/session/session.js';
import type { Account } from '@prisma/client';

export const load = async ({ locals, cookies }) => {
	const redirectURL = '/dashboard';
	// Use cookie instead of raw session payload since we neither want to encrypt the payload
	// here again nor send plain json object to third party.
	const sessionCookie = cookies.get(SESSION_COOKIE_KEY);
	const statePayload = { redirectURL, sessionCookie };
	const state = btoa(JSON.stringify(statePayload));

	const googleAuthorizationURL = getGoogleAuthorizationURL(state);

	return {
		session: locals.session!,
		googleAuthorizationURL,
		connectedAccounts: [] as (Account & { email: string })[]
	};
};
