import { listConnectedAccounts } from '$lib/infrastructure/auth/accountManagement.js';
import { getGoogleAuthorizationURL } from '$lib/infrastructure/auth/google.js';
import { SESSION_COOKIE_KEY } from '$lib/infrastructure/auth/session/session.js';

export const load = async ({ cookies, locals }) => {
	const redirectURL = '/dashboard';

	/**
	 * Use cookie instead of raw session payload (locals.session) since we neither want to encrypt the payload
	 * here again nor send plain json object to third party. */
	const sessionCookie = cookies.get(SESSION_COOKIE_KEY);
	const statePayload = { redirectURL, sessionCookie };
	const state = btoa(JSON.stringify(statePayload));

	const googleAuthorizationURL = getGoogleAuthorizationURL(state);

	const connectedAccounts = await listConnectedAccounts(locals.session!.userId);

	return { googleAuthorizationURL, connectedAccounts };
};
