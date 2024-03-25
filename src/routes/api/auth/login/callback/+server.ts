import { db } from '$lib/db';
import { Provider } from '$lib/domain/models.js';
import { validateGoogleIdTokenRequest } from '$lib/infrastructure/auth/google.js';
import { redirect } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
	const formData = await request.formData();

	const { accountId } = await validateGoogleIdTokenRequest({ formData, cookies });
	const account = await db.account.findFirst({ where: { id: accountId } });

	if (!account) await createUser(accountId);

	return redirect(302, '/dashboard');
}

const createUser = async (accountId: string) => {
	const newUser = { accounts: { create: { id: accountId, provider: Provider.google } } };
	await db.user.create({ data: newUser });
};
