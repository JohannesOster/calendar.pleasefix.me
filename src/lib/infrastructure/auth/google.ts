import { google } from 'googleapis';
import { config } from '$lib/config';
import { error, type Cookies } from '@sveltejs/kit';

const getGoogleOAuth2Client = () => {
	return new google.auth.OAuth2(
		config.google.clientID,
		config.google.clientSecret,
		config.google.authCallbackURL
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
	if (!csrf_token_cookie) error(400, 'No CSRF token in Cookie.');

	const csrf_token_body = formData.get(KEY);

	if (!csrf_token_body) error(400, 'No CSRF token in post body.');

	if (csrf_token_body !== csrf_token_cookie) {
		error(400, 'Failed to verify double submit cookie.');
	}

	const idToken = formData.get('credential') as string | null;
	if (!idToken) error(400, 'No id token in post body.');

	const ticket = await getGoogleOAuth2Client().verifyIdToken({
		idToken: idToken,
		audience: config.google.clientID
	});

	const googleSub = ticket.getUserId();
	if (!googleSub) error(400, 'No user ID in login ticket.');

	return { accountId: googleSub };
};
