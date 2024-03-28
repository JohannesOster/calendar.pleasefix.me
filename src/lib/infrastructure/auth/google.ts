import { google } from 'googleapis';
import { loadConfig } from '$lib/config';
import { error, type Cookies } from '@sveltejs/kit';

const { google: googleConfig } = await loadConfig();

export const getGoogleOAuth2Client = () => {
	return new google.auth.OAuth2(
		googleConfig.clientID,
		googleConfig.clientSecret,
		googleConfig.authCallbackURL
	);
};

type TokenValidationRequestParams = { formData: FormData; cookies: Cookies };
export const validateGoogleIdTokenRequest = async ({
	formData,
	cookies
}: TokenValidationRequestParams) => {
	// https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
	const KEY = 'g_csrf_token';
	const csrf_token_cookie = cookies.get(KEY);
	if (!csrf_token_cookie) error(400, 'No CSRF token in cookie.');

	const csrf_token_body = formData.get(KEY);

	if (!csrf_token_body) error(400, 'No CSRF token in post body.');

	if (csrf_token_body !== csrf_token_cookie) {
		error(400, 'Failed to verify double submit cookie.');
	}

	const idToken = formData.get('credential') as string | null;
	if (!idToken) error(400, 'No id token in post body.');

	const ticket = await getGoogleOAuth2Client().verifyIdToken({
		idToken: idToken,
		audience: googleConfig.clientID
	});

	const googleSub = ticket.getUserId();
	if (!googleSub) error(400, 'No user ID in login ticket.');

	return { accountId: googleSub };
};

export const getGoogleAuthorizationURL = (state: string) => {
	/**
	 * Note: "userinfo.email" scope somehow enforeces idToken to be included in authorization callbacks.
	 * They are required to assign connect the refresh token to the account, so make sure this scope stays
	 */
	const scopes = ['userinfo.email', 'calendar']
		.map((scope) => `https://www.googleapis.com/auth/${scope}`)
		.join(' ');

	// login-hint: https://github.com/google/google-api-javascript-client/issues/567
	return getGoogleOAuth2Client().generateAuthUrl({
		access_type: 'offline',
		scope: scopes,
		state,
		include_granted_scopes: true
	});
};

export const exchangeGoogleAuthToken = async (code: string) => {
	const googleOAuth2Client = getGoogleOAuth2Client();
	const { tokens } = await googleOAuth2Client.getToken(code);
	googleOAuth2Client.setCredentials(tokens);

	const idToken = googleOAuth2Client.credentials.id_token;
	if (!idToken) error(400, 'Did not receive id token');
	const { clientID: audience } = googleConfig;
	const ticket = await googleOAuth2Client.verifyIdToken({ idToken, audience });

	const accountId = ticket.getUserId();
	if (!accountId) error(400, "Couldn't retrieve account id");

	return { accountId, refreshToken: tokens.refresh_token };
};
