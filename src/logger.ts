import * as config from 'config';
import * as pino from 'pino';

const logger = pino();
logger.level = config.get('log_level');

export default logger;
