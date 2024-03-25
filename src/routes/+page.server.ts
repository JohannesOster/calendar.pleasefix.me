import { db } from '$lib/db';

export const load = async () => {
	let user = await db.user.findFirst({});
	if (!user) user = await db.user.create({ data: {} });
	return { user };
};
