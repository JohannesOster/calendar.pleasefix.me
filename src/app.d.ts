// See https://kit.svelte.dev/docs/types#app

import type { SessionCookiePayload } from '$lib/infrastructure/auth/session';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			traceId: string;
			session?: SessionCookiePayload;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
