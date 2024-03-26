import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { Provider } from '$lib/domain/models.js';
import { validateGoogleIdTokenRequest } from '$lib/infrastructure/auth/google.js';
import { logger } from '$lib/infrastructure/logger.js';

export async function POST({ request, cookies, locals }) {
	const { traceId } = locals;
	const formData = await request.formData();

	const { accountId } = await validateGoogleIdTokenRequest({ formData, cookies });
	const account = await db.account.findFirst({ where: { id: accountId } });

	if (!account) {
		logger().info({ traceId, message: 'No account found. Create new user and account.' });
		await createUserAndAccount(accountId);
	}

	return redirect(302, '/dashboard');
}

const createUserAndAccount = async (accountId: string) => {
	const newUser = { accounts: { create: { id: accountId, provider: Provider.google } } };
	await db.user.create({ data: newUser });
};
