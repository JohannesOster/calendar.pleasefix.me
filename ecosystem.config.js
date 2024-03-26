module.exports = {
	apps: [
		{
			name: 'calendars.pleasefix.me',
			script: './index.js',
			env_production: {
				NODE_ENV: 'production',
				GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
				SESSION_ENCRYPTION_KEY: process.env.SESSION_ENCRYPTION_KEY,
				DATABASE_URL: process.env.DATABASE_URL
			}
		}
	]
};
