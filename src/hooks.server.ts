import { generateTraceId } from '$lib/infrastructure/logger';

export const handle = async ({ event, resolve }) => {
	event.locals.traceId = generateTraceId();
	return await resolve(event);
};
