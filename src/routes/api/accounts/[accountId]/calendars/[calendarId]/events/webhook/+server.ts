import { logger } from '$lib/infrastructure/logger.js';
import { error, json } from '@sveltejs/kit';

export async function POST({ request, url, locals }) {
	const { traceId } = locals;

	const isGoogle = !!request.headers.get('X-Goog-Channel-ID');
	if (isGoogle) {
		// https://developers.google.com/calendar/api/guides/push#understanding-google-calendar-api-notification-events
		const resourceState = request.headers.get('X-Goog-Resource-State');
		if (resourceState === 'sync') {
			logger().info({ traceId, message: `Successfully established new channel` });
			return json({});
		}

		// ==== Send request to worker queue
		const channelId = request.headers.get('X-Goog-Channel-ID');
		if (!channelId) error(400, 'Missing channel ID');
		logger().info({
			traceId,
			message: `Received notification on channel ${channelId}. Push task to queue...`
		});

		// TODO: handle notification

		return json({});
	}

	error(400, 'Unsupported provider');
}
