module.exports = {
	apps: [
		{
			name: 'calendars.pleasefix.me',
			script: './index.js',
			env_production: {
				NODE_ENV: 'production',
				VITE_GOOGLE_OAUTH_CLIENT_SECRET: process.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET,
				VITE_SESSION_ENCRYPTION_KEY: process.env.VITE_SESSION_ENCRYPTION_KEY,
				DATABASE_URL: process.env.DATABASE_URL
			}
		}
	]
};
