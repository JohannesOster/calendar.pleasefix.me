import { setBaseURL } from '$lib/config';
import { getSession } from '$lib/infrastructure/auth/session';
import { generateTraceId, logger } from '$lib/infrastructure/logger';
import { redirect } from '@sveltejs/kit';
import localtunnel from 'localtunnel';

/**
 * In order to setup webhooks we need to add a tunnel
 * enabling external access to the app running on localhost. */
if (import.meta.env.DEV) {
	const tunnel = await localtunnel({ port: 5173 });

	logger().info(`Opened tunnel at ${tunnel.url}`);

	setBaseURL(tunnel.url);

	tunnel.on('error', (err) => {
		logger().error(`Tunnel error: ${err}`);
	});

	tunnel.on('close', () => {
		logger().warn(`Tunnel at ${tunnel.url} closed.`);
	});
}

export const handle = async ({ event, resolve }) => {
	event.locals.traceId = generateTraceId();
	try {
		event.locals.session = await getSession(event.cookies);
	} catch {
		if (event.url.pathname.startsWith('/dashboard')) return redirect(302, '/');
	}

	return await resolve(event);
};
