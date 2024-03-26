const _config = {
	development: {
		google: {
			clientID: '814682511130-he9mlhc4f1pprkkm4th426fto2o7fc32.apps.googleusercontent.com',
			clientSecret: '',
			authCallbackURL: 'http://localhost:5173/api/auth/login/callback'
		},
		sessionEnryptionKey: ''
	},
	production: {
		google: {
			clientID: '814682511130-he9mlhc4f1pprkkm4th426fto2o7fc32.apps.googleusercontent.com',
			clientSecret: '',
			authCallbackURL: 'https://pleasefix.me/api/auth/login/callback'
		},
		sessionEnryptionKey: ''
	}
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

	if (import.meta.env.SSR && typeof window === 'undefined') {
		const { env } = await import('$env/dynamic/private');
		base.sessionEnryptionKey = env.SESSION_ENCRYPTION_KEY || '';
		base.google.clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET || '';
	}

	return base;
};
