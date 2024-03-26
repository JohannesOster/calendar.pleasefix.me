import pinoLogger, { type Logger } from 'pino';
import { randomStr } from '$lib/utils';

let _logger: Logger;
export const logger = () => {
	if (!_logger) {
		const deploymentEnv = process.env.NODE_ENV || 'development';
		_logger = pinoLogger({ level: deploymentEnv === 'production' ? 'info' : 'debug' });
	}

	return _logger;
};

export const generateTraceId = () => randomStr();
