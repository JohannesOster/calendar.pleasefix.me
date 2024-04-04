const _config = {
	development: {
		google: {
			clientID: '814682511130-0o478o4iv077dfrbnc5aatbvfjll3a3b.apps.googleusercontent.com',
			clientSecret: '',
			authCallbackURL: 'http://localhost:5173/api/auth/google/callback'
		},
		redis: { host: 'localhost', port: 6379 },
		sessionEnryptionKey: '',
		baseURL: 'http://localhost:5173'
	},
	production: {
		google: {
			clientID: '814682511130-he9mlhc4f1pprkkm4th426fto2o7fc32.apps.googleusercontent.com',
			clientSecret: '',
			authCallbackURL: 'https://pleasefix.me/api/auth/google/callback'
		},
		redis: { host: 'localhost', port: 6379 },
		sessionEnryptionKey: '',
		baseURL: 'http://pleasefix.me'
	}
};

export const setBaseURL = (url: string) => {
	if (!import.meta.env.DEV) throw Error('Cannot set base URL in production');
	_config.development.baseURL = url;
};

const getEnv = () => {
	return (import.meta.env.MODE as keyof typeof _config | undefined) || 'development';
};

const getConfigForEnv = () => {
	const env = getEnv();
	return _config[env] || _config.development;
};

export const loadConfig = async () => {
	const base = getConfigForEnv();

	/**
	 * This is a bit of a dirty hack to get the environment variables in the server side.
	 * When accessing this file from the client importing $env/dynamic/private would throw an error.
	 * Therfore it has to be dynamically imported only when the config is accessed by code running on the server side.
	 *
	 * I also tried to simply split the config into two files, one for the client and one for the server, but that would
	 * "force" the importing file to know whether it runs on the server on not. This way the importing file has one interface.
	 */
	if (import.meta.env.SSR && typeof window === 'undefined') {
		const { env } = await import('$env/dynamic/private');
		base.sessionEnryptionKey = env.SESSION_ENCRYPTION_KEY || '';
		base.google.clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET || '';
	}

	return base;
};
