const _config = {
	development: {
		google: {
			clientID: '814682511130-he9mlhc4f1pprkkm4th426fto2o7fc32.apps.googleusercontent.com',
			clientSecret: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET,
			authCallbackURL: 'http://localhost:5173/api/auth/login/callback'
		},
		sessionEnryptionKey: import.meta.env.VITE_SESSION_ENCRYPTION_KEY || ''
	}
};

const getEnv = () => {
	return (process.env.NODE_ENV as keyof typeof _config | undefined) || 'development';
};

const getConfigForEnv = () => {
	const env = getEnv();
	return _config[env] || _config.development;
};

export const config = getConfigForEnv();
