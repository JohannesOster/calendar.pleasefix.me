import { getSession } from '$lib/infrastructure/auth/session';
import { generateTraceId } from '$lib/infrastructure/logger';
import { redirect } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
	event.locals.traceId = generateTraceId();
	try {
		event.locals.session = await getSession(event.cookies);
	} catch {
		if (event.url.pathname.startsWith('/dashboard')) return redirect(302, '/');
	}

	return await resolve(event);
};
